import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getZoneMetrics } from "@/lib/data/zones"
import { effectivePriceMxn } from "@/lib/data/normalize"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import { getUserPlan, PLAN_LIMITS } from "@/lib/user-plan"
import type { Listing, ZoneMetrics } from "@/types/database"

type ExportFormat = "excel" | "csv"

interface ExportFilters {
  zone_slug?: string
  property_type?: string
  listing_type?: string
  min_price?: number
  max_price?: number
}

interface ExportBody {
  format?: ExportFormat
  filters?: ExportFilters
}

interface ExportListing extends Listing {
  zone_name: string
  zone_slug: string
  zones: {
    name: string
    slug: string
  }
}

const MAX_ROWS = 5000

async function fetchListingsFromSupabase(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  filters: ExportFilters
): Promise<ExportListing[] | null> {
  try {
    let q = supabase.from("listings").select(`
      id, zone_id, title, property_type, listing_type,
      price_mxn, price_usd, area_m2, area_construccion_m2, area_terreno_m2,
      bedrooms, bathrooms, source_portal, external_url, scraped_at, created_at,
      zones!inner(name, slug)
    `).eq("is_active", true)

    if (filters.zone_slug) {
      q = q.eq("zones.slug", filters.zone_slug)
    }
    if (filters.property_type) {
      q = q.eq("property_type", filters.property_type)
    }
    if (filters.listing_type) {
      q = q.eq("listing_type", filters.listing_type)
    }
    const res = await q.limit(MAX_ROWS).order("scraped_at", { ascending: false })
    if (res.error || !res.data) return null

    const listings = (res.data as Array<Record<string, unknown>>)
      .map((row) => {
        const price = effectivePriceMxn(
          typeof row.price_mxn === "number" ? row.price_mxn : null,
          typeof row.price_usd === "number" ? row.price_usd : null,
        )
        const areaM2 = typeof row.area_m2 === "number" ? row.area_m2 : 0
        if (!price || price <= 0) return null
        if (filters.min_price && price < filters.min_price) return null
        if (filters.max_price && price > filters.max_price) return null

        const zone = row.zones as { name?: string; slug?: string } | null

        return {
          id: String(row.id),
          zone_id: String(row.zone_id),
          zone_name: zone?.name ?? "",
          zone_slug: zone?.slug ?? "",
          zones: {
            name: zone?.name ?? "",
            slug: zone?.slug ?? "",
          },
          title: String(row.title ?? ""),
          property_type: row.property_type as Listing["property_type"],
          listing_type: row.listing_type as Listing["listing_type"],
          price,
          area_m2: areaM2,
          area_construccion_m2: typeof row.area_construccion_m2 === "number" ? row.area_construccion_m2 : null,
          area_terreno_m2: typeof row.area_terreno_m2 === "number" ? row.area_terreno_m2 : null,
          price_per_m2: areaM2 > 0 ? price / areaM2 : 0,
          bedrooms: typeof row.bedrooms === "number" ? row.bedrooms : null,
          bathrooms: typeof row.bathrooms === "number" ? row.bathrooms : null,
          source: row.source_portal as Listing["source"],
          source_url: String(row.external_url ?? ""),
          scraped_at: String(row.scraped_at ?? row.created_at ?? ""),
          created_at: String(row.created_at ?? row.scraped_at ?? ""),
        } satisfies ExportListing
      })
      .filter((listing) => listing !== null) as ExportListing[]

    return listings
  } catch {
    return null
  }
}

function buildRowsFromZoneMetrics(zones: ZoneMetrics[], filters: ExportFilters) {
  const typeLabels: Record<string, string> = {
    casa: "Casa",
    departamento: "Departamento",
    terreno: "Terreno",
    local: "Local",
    oficina: "Oficina",
  }

  const rows: Record<string, string | number>[] = []

  for (const zone of zones) {
    if (filters.zone_slug && zone.zone_slug !== filters.zone_slug) continue

    for (const [type] of Object.entries(zone.listings_by_type)) {
      if (filters.property_type && type !== filters.property_type) continue
      const avgTicket = zone.avg_ticket_by_type[type as keyof typeof zone.avg_ticket_by_type] ?? 0
      rows.push({
        Zona: zone.zone_name,
        "Tipo de Propiedad": typeLabels[type] ?? type,
        "Precio/m² Promedio (MXN)": zone.avg_price_per_m2,
        "Ticket Promedio (MXN)": avgTicket,
        "Tendencia (%)": zone.price_trend_pct,
      })
    }
  }

  return rows
}

export async function POST(req: NextRequest) {
  const planInfo = await getUserPlan()
  if (!planInfo) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { plan, userId } = planInfo
  const limit = PLAN_LIMITS[plan].exports_per_month
  const limited = await rateLimit(`export:${userId}`, limit, 30 * 86_400_000)
  if (limited) return limited

  const supabase = await createSupabaseServerClient()

  const body = await req.json().catch(() => ({})) as ExportBody
  const format: ExportFormat = body.format === "csv" ? "csv" : "excel"
  const filters: ExportFilters = body.filters ?? {}

  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]

  // Try Supabase listings first, fall back to zone metrics summary
  const listings = await fetchListingsFromSupabase(supabase, filters)

  let rows: Record<string, string | number>[]

  if (listings && listings.length > 0) {
    rows = (listings as (Listing & { zones?: { name: string; slug: string } })[]).map((l) => ({
      ID: l.id,
      Título: l.title,
      Zona: (l as { zones?: { name: string; slug: string } }).zones?.name ?? "",
      "Tipo de Propiedad": l.property_type,
      "Tipo de Operación": l.listing_type,
      "Precio (MXN)": l.price,
      "Área (m²)": l.area_m2,
      "Área Construcción (m²)": (l as unknown as Record<string, number | null>).area_construccion_m2 ?? "",
      "Área Terreno (m²)": (l as unknown as Record<string, number | null>).area_terreno_m2 ?? "",
      "Precio/m² (MXN)": l.price_per_m2,
      Recámaras: l.bedrooms ?? "",
      Baños: l.bathrooms ?? "",
      Portal: l.source,
      URL: l.source_url,
      "Fecha Scraping": l.scraped_at,
    }))
  } else {
    // Fall back to zone metrics aggregate rows
    const zones = await getZoneMetrics()
    rows = buildRowsFromZoneMetrics(zones, filters)
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data found for the given filters" }, { status: 404 })
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Listings")

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inmobiq-listings-${dateStr}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  }

  // Excel
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inmobiq-listings-${dateStr}.xlsx"`,
      "Cache-Control": "no-store",
    },
  })
}
