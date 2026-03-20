import { createSupabaseServerClient } from "@/lib/supabase-server"
import { MOCK_LISTINGS } from "@/lib/mock-data"
import type { Listing, PropertyType, ListingType } from "@/types/database"

export interface ListingFilters {
  tipos?: PropertyType[]
  zonas?: string[]   // zone slugs
  listing_type?: ListingType
  precio_min?: number
  precio_max?: number
  area_min?: number
  area_max?: number
  recamaras?: number[]  // 1,2,3,4 — 4 means "4+"
}

export interface ListingsResult {
  listings: Listing[]
  total: number
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

/** Resolve zone slugs to real UUIDs from Supabase */
async function resolveZoneSlugs(slugs: string[]): Promise<string[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("zones")
      .select("id, slug")
      .in("slug", slugs)
    return (data ?? []).map((z: { id: string }) => z.id)
  } catch {
    return []
  }
}

function applyMockFilters(filters: ListingFilters): ListingsResult {
  let results = [...MOCK_LISTINGS]

  if (filters.tipos?.length) {
    results = results.filter((l) => filters.tipos!.includes(l.property_type))
  }
  if (filters.zonas?.length) {
    // Mock data uses simple numeric IDs; just filter by zone_id matching the slug index
    const MOCK_SLUG_TO_ID: Record<string, string> = {
      "zona-rio": "1", "playas-de-tijuana": "2", otay: "3", chapultepec: "4",
      hipodromo: "5", centro: "6", "residencial-del-bosque": "7", "la-mesa": "8",
    }
    const ids = filters.zonas.map((s) => MOCK_SLUG_TO_ID[s]).filter(Boolean)
    if (ids.length) results = results.filter((l) => ids.includes(l.zone_id))
  }
  if (filters.listing_type) {
    results = results.filter((l) => l.listing_type === filters.listing_type)
  }
  if (filters.precio_min != null) {
    results = results.filter((l) => l.price >= filters.precio_min!)
  }
  if (filters.precio_max != null) {
    results = results.filter((l) => l.price <= filters.precio_max!)
  }
  if (filters.area_min != null) {
    results = results.filter((l) => l.area_m2 >= filters.area_min!)
  }
  if (filters.area_max != null) {
    results = results.filter((l) => l.area_m2 <= filters.area_max!)
  }
  if (filters.recamaras?.length) {
    results = results.filter((l) => {
      if (l.bedrooms == null) return false
      return filters.recamaras!.some((r) =>
        r === 4 ? l.bedrooms! >= 4 : l.bedrooms === r
      )
    })
  }

  return { listings: results, total: results.length }
}

export async function getListings(filters: ListingFilters = {}): Promise<ListingsResult> {
  if (useMock()) return applyMockFilters(filters)

  try {
    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from("listings")
      .select("id, zone_id, title, property_type, listing_type, price_mxn, price_usd, area_m2, bedrooms, bathrooms, source_portal, external_url, scraped_at, created_at, raw_data")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100)

    if (filters.tipos?.length) query = query.in("property_type", filters.tipos)
    if (filters.zonas?.length) {
      const ids = await resolveZoneSlugs(filters.zonas)
      if (ids.length) query = query.in("zone_id", ids)
    }
    if (filters.listing_type) query = query.eq("listing_type", filters.listing_type)
    if (filters.precio_min != null) query = query.or(`price_mxn.gte.${filters.precio_min},price_usd.gte.${filters.precio_min}`)
    if (filters.precio_max != null) query = query.or(`price_mxn.lte.${filters.precio_max},price_usd.lte.${filters.precio_max}`)
    if (filters.area_min != null) query = query.gte("area_m2", filters.area_min)
    if (filters.area_max != null) query = query.lte("area_m2", filters.area_max)
    if (filters.recamaras?.length) {
      const has4plus = filters.recamaras.includes(4)
      const exact = filters.recamaras.filter((r) => r < 4)
      if (has4plus && exact.length) {
        query = query.or(`bedrooms.gte.4,bedrooms.in.(${exact.join(",")})`)
      } else if (has4plus) {
        query = query.gte("bedrooms", 4)
      } else {
        query = query.in("bedrooms", exact)
      }
    }

    const { data, error } = await query
    if (error) throw error

    // Map real DB columns to Listing interface
    const listings: Listing[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      zone_id: row.zone_id as string,
      title: (row.title as string) ?? "",
      property_type: row.property_type as Listing["property_type"],
      listing_type: row.listing_type as Listing["listing_type"],
      price: (row.price_mxn as number) ?? (row.price_usd as number) ?? 0,
      area_m2: (row.area_m2 as number) ?? 0,
      price_per_m2: (row.area_m2 as number) > 0
        ? ((row.price_mxn as number) ?? (row.price_usd as number) ?? 0) / (row.area_m2 as number)
        : 0,
      bedrooms: (row.bedrooms as number) ?? null,
      bathrooms: (row.bathrooms as number) ?? null,
      source: row.source_portal as Listing["source"],
      source_url: (row.external_url as string) ?? "",
      scraped_at: (row.scraped_at as string) ?? "",
      created_at: (row.created_at as string) ?? "",
      raw_data: (row.raw_data as Record<string, unknown>) ?? undefined,
    }))

    return listings.length > 0
      ? { listings, total: listings.length }
      : applyMockFilters(filters)
  } catch {
    return applyMockFilters(filters)
  }
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */

export interface ListingsAnalytics {
  pricePerM2ByZone: { zone_name: string; zone_slug: string; median_price_m2: number; count: number }[]
  priceDistribution: { range: string; count: number; pct: number }[]
  compositionByType: { type: string; count: number; pct: number }[]
  offerConcentration: { zone_name: string; zone_slug: string; count: number; pct: number }[]
  totalListings: number
  medianPrice: number
}

export interface ZoneListingsAnalytics {
  priceByBedrooms: { bedrooms: number; casa_median: number | null; depto_median: number | null; casa_count: number; depto_count: number }[]
  casaVsDepto: { type: string; median_price: number; median_area: number; median_price_m2: number; count: number }[]
  scatterData: { price: number; area: number; type: string; title: string }[]
}

/** Return the median of a numeric array (returns 0 for empty arrays). */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Round to 2 decimal places */
function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 10000) / 100
}

/* ---------- mock helpers ---------- */

function mockListingsAnalytics(): ListingsAnalytics {
  const totalListings = 1483
  return {
    pricePerM2ByZone: [
      { zone_name: "Playas de Tijuana", zone_slug: "playas-de-tijuana", median_price_m2: 38200, count: 287 },
      { zone_name: "Zona Río", zone_slug: "zona-rio", median_price_m2: 32500, count: 342 },
      { zone_name: "Chapultepec", zone_slug: "chapultepec", median_price_m2: 28900, count: 156 },
      { zone_name: "Hipódromo", zone_slug: "hipodromo", median_price_m2: 25400, count: 124 },
      { zone_name: "Otay", zone_slug: "otay", median_price_m2: 18500, count: 198 },
      { zone_name: "Centro", zone_slug: "centro", median_price_m2: 15800, count: 178 },
      { zone_name: "Residencial del Bosque", zone_slug: "residencial-del-bosque", median_price_m2: 22100, count: 98 },
      { zone_name: "La Mesa", zone_slug: "la-mesa", median_price_m2: 14200, count: 100 },
    ],
    priceDistribution: [
      { range: "<1M", count: 148, pct: 9.98 },
      { range: "1M-3M", count: 445, pct: 30.01 },
      { range: "3M-5M", count: 371, pct: 25.02 },
      { range: "5M-10M", count: 297, pct: 20.03 },
      { range: "10M-20M", count: 163, pct: 10.99 },
      { range: ">20M", count: 59, pct: 3.98 },
    ],
    compositionByType: [
      { type: "departamento", count: 623, pct: 42.01 },
      { type: "casa", count: 490, pct: 33.04 },
      { type: "terreno", count: 148, pct: 9.98 },
      { type: "local", count: 133, pct: 8.97 },
      { type: "oficina", count: 89, pct: 6.0 },
    ],
    offerConcentration: [
      { zone_name: "Zona Río", zone_slug: "zona-rio", count: 342, pct: 23.06 },
      { zone_name: "Playas de Tijuana", zone_slug: "playas-de-tijuana", count: 287, pct: 19.35 },
      { zone_name: "Otay", zone_slug: "otay", count: 198, pct: 13.35 },
      { zone_name: "Centro", zone_slug: "centro", count: 178, pct: 12.0 },
      { zone_name: "Chapultepec", zone_slug: "chapultepec", count: 156, pct: 10.52 },
      { zone_name: "Hipódromo", zone_slug: "hipodromo", count: 124, pct: 8.36 },
      { zone_name: "La Mesa", zone_slug: "la-mesa", count: 100, pct: 6.74 },
      { zone_name: "Residencial del Bosque", zone_slug: "residencial-del-bosque", count: 98, pct: 6.61 },
    ],
    totalListings,
    medianPrice: 3850000,
  }
}

function mockZoneListingsAnalytics(): ZoneListingsAnalytics {
  return {
    priceByBedrooms: [
      { bedrooms: 1, casa_median: null, depto_median: 1800000, casa_count: 0, depto_count: 32 },
      { bedrooms: 2, casa_median: 3200000, depto_median: 2600000, casa_count: 18, depto_count: 65 },
      { bedrooms: 3, casa_median: 4800000, depto_median: 3500000, casa_count: 42, depto_count: 38 },
      { bedrooms: 4, casa_median: 6500000, depto_median: 5200000, casa_count: 25, depto_count: 12 },
    ],
    casaVsDepto: [
      { type: "casa", median_price: 4800000, median_area: 180, median_price_m2: 26667, count: 85 },
      { type: "departamento", median_price: 3200000, median_area: 95, median_price_m2: 33684, count: 147 },
    ],
    scatterData: [
      { price: 2500000, area: 85, type: "departamento", title: "Depto moderno 2 rec" },
      { price: 3800000, area: 120, type: "departamento", title: "Depto amplio 3 rec vista al mar" },
      { price: 4200000, area: 160, type: "casa", title: "Casa 3 rec con jardín" },
      { price: 6100000, area: 220, type: "casa", title: "Casa premium 4 rec" },
      { price: 1900000, area: 65, type: "departamento", title: "Estudio amueblado" },
      { price: 5500000, area: 200, type: "casa", title: "Casa esquina remodelada" },
      { price: 3100000, area: 110, type: "departamento", title: "Depto 2 rec alberca" },
      { price: 7200000, area: 280, type: "casa", title: "Residencia con roof garden" },
    ],
  }
}

/* ---------- getListingsAnalytics ---------- */

export async function getListingsAnalytics(): Promise<ListingsAnalytics> {
  if (useMock()) return mockListingsAnalytics()

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("listings")
      .select("price_mxn, area_m2, property_type, zone_id, zones(name, slug)")
      .eq("is_active", true)

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) return mockListingsAnalytics()

    type Row = {
      price_mxn: number | null
      area_m2: number | null
      property_type: string
      zone_id: string
      zones: { name: string; slug: string } | null
    }
    const listings = rows as unknown as Row[]

    // --- totalListings & medianPrice ---
    const withPrice = listings.filter((l) => (l.price_mxn ?? 0) > 0)
    const totalListings = listings.length
    const medianPrice = median(withPrice.map((l) => l.price_mxn!))

    // --- pricePerM2ByZone ---
    const zoneMap = new Map<string, { name: string; slug: string; values: number[] }>()
    for (const l of listings) {
      if ((l.price_mxn ?? 0) > 0 && (l.area_m2 ?? 0) > 0 && l.zones) {
        const key = l.zones.slug
        if (!zoneMap.has(key)) zoneMap.set(key, { name: l.zones.name, slug: l.zones.slug, values: [] })
        zoneMap.get(key)!.values.push(l.price_mxn! / l.area_m2!)
      }
    }
    const pricePerM2ByZone = Array.from(zoneMap.values())
      .map((z) => ({ zone_name: z.name, zone_slug: z.slug, median_price_m2: Math.round(median(z.values)), count: z.values.length }))
      .sort((a, b) => b.median_price_m2 - a.median_price_m2)

    // --- priceDistribution ---
    const ranges: { label: string; min: number; max: number }[] = [
      { label: "<1M", min: 0, max: 1_000_000 },
      { label: "1M-3M", min: 1_000_000, max: 3_000_000 },
      { label: "3M-5M", min: 3_000_000, max: 5_000_000 },
      { label: "5M-10M", min: 5_000_000, max: 10_000_000 },
      { label: "10M-20M", min: 10_000_000, max: 20_000_000 },
      { label: ">20M", min: 20_000_000, max: Infinity },
    ]
    const priceDistribution = ranges.map((r) => {
      const count = withPrice.filter((l) => l.price_mxn! >= r.min && l.price_mxn! < r.max).length
      return { range: r.label, count, pct: pct(count, withPrice.length) }
    })

    // --- compositionByType ---
    const typeCount = new Map<string, number>()
    for (const l of listings) {
      typeCount.set(l.property_type, (typeCount.get(l.property_type) ?? 0) + 1)
    }
    const compositionByType = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count, pct: pct(count, totalListings) }))
      .sort((a, b) => b.count - a.count)

    // --- offerConcentration ---
    const zoneCountMap = new Map<string, { name: string; slug: string; count: number }>()
    for (const l of listings) {
      if (l.zones) {
        const key = l.zones.slug
        if (!zoneCountMap.has(key)) zoneCountMap.set(key, { name: l.zones.name, slug: l.zones.slug, count: 0 })
        zoneCountMap.get(key)!.count++
      }
    }
    const offerConcentration = Array.from(zoneCountMap.values())
      .map((z) => ({ zone_name: z.name, zone_slug: z.slug, count: z.count, pct: pct(z.count, totalListings) }))
      .sort((a, b) => b.count - a.count)

    return { pricePerM2ByZone, priceDistribution, compositionByType, offerConcentration, totalListings, medianPrice }
  } catch {
    return mockListingsAnalytics()
  }
}

/* ---------- getZoneListingsAnalytics ---------- */

export async function getZoneListingsAnalytics(slug: string): Promise<ZoneListingsAnalytics> {
  if (useMock()) return mockZoneListingsAnalytics()

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("listings")
      .select("title, price_mxn, area_m2, property_type, bedrooms, zones!inner(slug)")
      .eq("is_active", true)
      .eq("zones.slug", slug)

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) return mockZoneListingsAnalytics()

    type Row = {
      title: string | null
      price_mxn: number | null
      area_m2: number | null
      property_type: string
      bedrooms: number | null
      zones: { slug: string } | null
    }
    const listings = rows as unknown as Row[]

    // --- priceByBedrooms ---
    const priceByBedrooms = [1, 2, 3, 4].map((br) => {
      const casas = listings.filter((l) => l.property_type === "casa" && l.bedrooms === br && (l.price_mxn ?? 0) > 0)
      const deptos = listings.filter((l) => l.property_type === "departamento" && l.bedrooms === br && (l.price_mxn ?? 0) > 0)
      return {
        bedrooms: br,
        casa_median: casas.length > 0 ? Math.round(median(casas.map((l) => l.price_mxn!))) : null,
        depto_median: deptos.length > 0 ? Math.round(median(deptos.map((l) => l.price_mxn!))) : null,
        casa_count: casas.length,
        depto_count: deptos.length,
      }
    })

    // --- casaVsDepto ---
    const casaVsDepto = (["casa", "departamento"] as const).map((type) => {
      const items = listings.filter((l) => l.property_type === type && (l.price_mxn ?? 0) > 0 && (l.area_m2 ?? 0) > 0)
      const medPrice = Math.round(median(items.map((l) => l.price_mxn!)))
      const medArea = Math.round(median(items.map((l) => l.area_m2!)))
      const medPriceM2 = Math.round(median(items.map((l) => l.price_mxn! / l.area_m2!)))
      return { type, median_price: medPrice, median_area: medArea, median_price_m2: medPriceM2, count: items.length }
    })

    // --- scatterData ---
    const scatterData = listings
      .filter((l) => (l.price_mxn ?? 0) > 0 && (l.area_m2 ?? 0) > 0)
      .map((l) => ({
        price: l.price_mxn!,
        area: l.area_m2!,
        type: l.property_type,
        title: l.title ?? "",
      }))

    return { priceByBedrooms, casaVsDepto, scatterData }
  } catch {
    return mockZoneListingsAnalytics()
  }
}
