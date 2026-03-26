import type { PropertyType, ListingType } from "@/types/database";
import type { RawListing } from "../types";
import type { ExtractedData } from "./extractor";
import { detectPortal, generateExternalId } from "./portal-detector";

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  casa: "casa",
  house: "casa",
  residencia: "casa",
  "single family": "casa",
  departamento: "departamento",
  depa: "departamento",
  apartamento: "departamento",
  apartment: "departamento",
  flat: "departamento",
  condominio: "departamento",
  terreno: "terreno",
  lote: "terreno",
  land: "terreno",
  local: "local",
  "local comercial": "local",
  comercial: "local",
  oficina: "oficina",
  office: "oficina",
};

const LISTING_TYPE_MAP: Record<string, ListingType> = {
  venta: "venta",
  sale: "venta",
  "for sale": "venta",
  "en venta": "venta",
  renta: "renta",
  rent: "renta",
  "for rent": "renta",
  "en renta": "renta",
  alquiler: "renta",
  arriendo: "renta",
};

/**
 * Normalize raw extracted data into a RawListing.
 * Returns a Partial — property_type and listing_type may be null if undetectable.
 */
export function normalizeToListing(
  extracted: ExtractedData,
  url: string,
): Partial<RawListing> & { _property_type_hint: string | null; _listing_type_hint: string | null } {
  // Strip URL fragment (#...) — not needed for identification
  const cleanUrl = url.split("#")[0];
  const portal = detectPortal(cleanUrl);
  const externalId = generateExternalId(cleanUrl);

  // Normalize property type
  const ptHint = (extracted.property_type_hint ?? "").toLowerCase().trim();
  const propertyType: PropertyType | null = PROPERTY_TYPE_MAP[ptHint] ?? null;

  // Normalize listing type
  const ltHint = (extracted.listing_type_hint ?? "").toLowerCase().trim();
  const listingType: ListingType | null = LISTING_TYPE_MAP[ltHint] ?? null;

  // Handle currency → price_mxn / price_usd
  let priceMxn: number | null = null;
  let priceUsd: number | null = null;

  if (extracted.price_amount) {
    const currency = (extracted.currency ?? "MXN").toUpperCase();
    if (currency === "USD" || currency === "US$") {
      priceUsd = extracted.price_amount;
    } else {
      priceMxn = extracted.price_amount;
    }
  }

  // Resolve absolute image URLs
  const images = extracted.images
    .map((img) => resolveUrl(img, url))
    .filter(Boolean) as string[];

  const listing: Partial<RawListing> & { _property_type_hint: string | null; _listing_type_hint: string | null } = {
    source_portal: portal,
    external_id: externalId,
    external_url: cleanUrl,
    title: extracted.title ?? null,
    description: extracted.description ?? null,
    price_mxn: priceMxn,
    price_usd: priceUsd,
    area_m2: extracted.area_m2,
    area_construccion_m2: extracted.area_construccion_m2 ?? (propertyType !== "terreno" ? extracted.area_m2 : null),
    area_terreno_m2: extracted.area_terreno_m2 ?? (propertyType === "terreno" ? extracted.area_m2 : null),
    bedrooms: extracted.bedrooms,
    bathrooms: extracted.bathrooms,
    parking: extracted.parking,
    lat: extracted.lat,
    lng: extracted.lng,
    address: extracted.address,
    images,
    raw_data: { extraction_source: "universal" },
    // These may be null — UI must force selection before save
    ...(propertyType ? { property_type: propertyType } : {}),
    ...(listingType ? { listing_type: listingType } : {}),
    // Hints for UI display
    _property_type_hint: ptHint || null,
    _listing_type_hint: ltHint || null,
  };

  return listing;
}

function resolveUrl(src: string, baseUrl: string): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}
