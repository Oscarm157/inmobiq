import { NextResponse, type NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseClient, getZones, upsertListings } from "@/scraper/db";
import type { RawListing } from "@/scraper/types";
import type { PropertyType, ListingType, SourcePortal } from "@/types/database";

const VALID_PROPERTY_TYPES: PropertyType[] = ["casa", "departamento", "terreno", "local", "oficina"];
const VALID_LISTING_TYPES: ListingType[] = ["venta", "renta"];
const VALID_PORTALS: SourcePortal[] = ["inmuebles24", "lamudi", "vivanuncios", "mercadolibre", "otro"];

export async function POST(request: NextRequest) {
  // Auth check
  const check = await verifyAdmin();
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let body: { jobId: string; listing: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { jobId, listing: raw } = body;

  // Validate required fields
  if (!raw.source_portal || !VALID_PORTALS.includes(raw.source_portal as SourcePortal)) {
    return NextResponse.json({ error: "source_portal inválido" }, { status: 400 });
  }
  if (!raw.external_id || typeof raw.external_id !== "string") {
    return NextResponse.json({ error: "external_id requerido" }, { status: 400 });
  }
  if (!raw.external_url || typeof raw.external_url !== "string") {
    return NextResponse.json({ error: "external_url requerido" }, { status: 400 });
  }
  if (!raw.property_type || !VALID_PROPERTY_TYPES.includes(raw.property_type as PropertyType)) {
    return NextResponse.json({ error: "property_type requerido (casa, departamento, terreno, local, oficina)" }, { status: 400 });
  }
  if (!raw.listing_type || !VALID_LISTING_TYPES.includes(raw.listing_type as ListingType)) {
    return NextResponse.json({ error: "listing_type requerido (venta, renta)" }, { status: 400 });
  }

  // Build RawListing
  const listing: RawListing = {
    source_portal: raw.source_portal as SourcePortal,
    external_id: raw.external_id as string,
    external_url: raw.external_url as string,
    title: (raw.title as string) || null,
    description: (raw.description as string) || null,
    property_type: raw.property_type as PropertyType,
    listing_type: raw.listing_type as ListingType,
    price_mxn: typeof raw.price_mxn === "number" ? raw.price_mxn : null,
    price_usd: typeof raw.price_usd === "number" ? raw.price_usd : null,
    area_m2: typeof raw.area_m2 === "number" ? raw.area_m2 : null,
    bedrooms: typeof raw.bedrooms === "number" ? raw.bedrooms : null,
    bathrooms: typeof raw.bathrooms === "number" ? raw.bathrooms : null,
    parking: typeof raw.parking === "number" ? raw.parking : null,
    lat: typeof raw.lat === "number" ? raw.lat : null,
    lng: typeof raw.lng === "number" ? raw.lng : null,
    address: (raw.address as string) || null,
    images: Array.isArray(raw.images) ? raw.images.filter((i): i is string => typeof i === "string") : [],
    raw_data: { source: "admin_scraper", saved_by: check.userId },
  };

  try {
    // Upsert using existing pipeline (zone assignment + fingerprints + dedup)
    const zones = await getZones();
    const stats = await upsertListings([listing], zones);

    // Update scrape job if jobId provided
    if (jobId) {
      const sb = getSupabaseClient();
      await sb
        .from("scrape_jobs")
        .update({ status: "saved" })
        .eq("id", jobId);
    }

    return NextResponse.json({
      success: true,
      stats: {
        new: stats.new_,
        updated: stats.updated,
        zoneAssigned: stats.zoneAssigned,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error guardando: ${message}` }, { status: 500 });
  }
}
