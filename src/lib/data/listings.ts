import { createSupabaseServerClient } from "@/lib/supabase-server"
import { MOCK_LISTINGS, TIJUANA_ZONES } from "@/lib/mock-data"
import type { Listing, PropertyType, ListingType } from "@/types/database"
import { filterNormalizedListings, filterByCategory, effectivePriceMxn, RESIDENTIAL_TYPES, COMMERCIAL_TYPES, LAND_TYPES, type PropertyCategory } from "@/lib/data/normalize"

/** Dynamic price ranges based on listing type (venta = millions, renta = thousands) */
function getPriceRanges(listingType?: string): { label: string; min: number; max: number }[] {
  if (listingType === "renta") {
    return [
      { label: "<5K", min: 0, max: 5_000 },
      { label: "5K-10K", min: 5_000, max: 10_000 },
      { label: "10K-20K", min: 10_000, max: 20_000 },
      { label: "20K-40K", min: 20_000, max: 40_000 },
      { label: "40K-80K", min: 40_000, max: 80_000 },
      { label: ">80K", min: 80_000, max: Infinity },
    ]
  }
  return [
    { label: "<1M", min: 0, max: 1_000_000 },
    { label: "1M-3M", min: 1_000_000, max: 3_000_000 },
    { label: "3M-5M", min: 3_000_000, max: 5_000_000 },
    { label: "5M-10M", min: 5_000_000, max: 10_000_000 },
    { label: "10M-20M", min: 10_000_000, max: 20_000_000 },
    { label: ">20M", min: 20_000_000, max: Infinity },
  ]
}

/** Build zone name lookup from mock data (single source of truth) */
const MOCK_ZONE_LOOKUP = new Map(
  TIJUANA_ZONES.map((z) => [z.zone_id, { name: z.zone_name, slug: z.zone_slug }])
)

export interface ListingFilters {
  tipos?: PropertyType[]
  zonas?: string[]   // zone slugs
  listing_type?: ListingType
  categoria?: PropertyCategory  // "residencial" | "comercial" | "terreno"
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

export function applyMockFilters(filters: ListingFilters): ListingsResult {
  let results = [...MOCK_LISTINGS]

  // Normalize: filter out suspected misclassified rentals
  results = filterNormalizedListings(results)

  // Category filter
  if (filters.categoria) {
    results = filterByCategory(results, filters.categoria)
  }

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

    // Resolve categoria + tipos into effective property type filter
    const getListingsCatTypes: Record<PropertyCategory, PropertyType[]> = { residencial: RESIDENTIAL_TYPES, comercial: COMMERCIAL_TYPES, terreno: LAND_TYPES }
    if (filters.categoria && filters.tipos?.length) {
      const intersection = filters.tipos.filter((t) => getListingsCatTypes[filters.categoria!].includes(t))
      query = query.in("property_type", intersection.length > 0 ? intersection : getListingsCatTypes[filters.categoria])
    } else if (filters.categoria) {
      query = query.in("property_type", getListingsCatTypes[filters.categoria])
    } else if (filters.tipos?.length) {
      query = query.in("property_type", filters.tipos)
    }
    if (filters.zonas?.length) {
      const ids = await resolveZoneSlugs(filters.zonas)
      if (ids.length) query = query.in("zone_id", ids)
    }
    if (filters.listing_type) query = query.eq("listing_type", filters.listing_type)
    // Price filters applied post-fetch after USD→MXN conversion (can't do arithmetic in Supabase filter)
    if (filters.precio_min != null || filters.precio_max != null) {
      query = query.or("price_mxn.gt.0,price_usd.gt.0")
    }
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

    // Map real DB columns to Listing interface (USD→MXN conversion happens here)
    let listings: Listing[] = (data ?? []).map((row: Record<string, unknown>) => {
      const priceMxn = effectivePriceMxn(row.price_mxn as number | null, row.price_usd as number | null) ?? 0
      const area = (row.area_m2 as number) ?? 0
      return {
        id: row.id as string,
        zone_id: row.zone_id as string,
        title: (row.title as string) ?? "",
        property_type: row.property_type as Listing["property_type"],
        listing_type: row.listing_type as Listing["listing_type"],
        price: priceMxn,
        area_m2: area,
        price_per_m2: area > 0 ? priceMxn / area : 0,
        bedrooms: (row.bedrooms as number) ?? null,
        bathrooms: (row.bathrooms as number) ?? null,
        source: row.source_portal as Listing["source"],
        source_url: (row.external_url as string) ?? "",
        scraped_at: (row.scraped_at as string) ?? "",
        created_at: (row.created_at as string) ?? "",
        raw_data: (row.raw_data as Record<string, unknown>) ?? undefined,
        original_currency: (row.price_mxn as number | null) ? "MXN" as const : (row.price_usd as number | null) ? "USD" as const : undefined,
      }
    })

    // Normalize: filter out suspected misclassified rentals
    listings = filterNormalizedListings(listings)

    // Post-fetch price filters (applied here because USD→MXN conversion happens in mapping)
    if (filters.precio_min != null) {
      listings = listings.filter((l) => l.price >= filters.precio_min!)
    }
    if (filters.precio_max != null) {
      listings = listings.filter((l) => l.price <= filters.precio_max!)
    }

    // Category filter
    if (filters.categoria) {
      listings = filterByCategory(listings, filters.categoria)
    }

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
  avgPrice: number
}

export interface ZoneListingsAnalytics {
  priceByBedrooms: { bedrooms: number; casa_median: number | null; depto_median: number | null; casa_count: number; depto_count: number }[] | null
  typeComparison: { type: string; median_price: number; median_area: number; median_price_m2: number; count: number }[]
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

function mockListingsAnalytics(filters: ListingFilters = {}): ListingsAnalytics {
  // Apply filters to mock listings first, then compute analytics from filtered set
  const { listings: filtered } = applyMockFilters(filters)
  const hasFilters = (filters.tipos?.length ?? 0) > 0 || !!filters.listing_type ||
    (filters.zonas?.length ?? 0) > 0 || filters.precio_min != null ||
    filters.precio_max != null || filters.area_min != null ||
    filters.area_max != null || (filters.recamaras?.length ?? 0) > 0

  // If no filters, derive from TIJUANA_ZONES as single source of truth
  if (!hasFilters) {
    const totalListings = TIJUANA_ZONES.reduce((s, z) => s + z.total_listings, 0)

    // Build offerConcentration from TIJUANA_ZONES (sorted by count desc)
    const sorted = [...TIJUANA_ZONES].sort((a, b) => b.total_listings - a.total_listings)
    const offerConcentration = sorted.map((z) => ({
      zone_name: z.zone_name,
      zone_slug: z.zone_slug,
      count: z.total_listings,
      pct: Math.round((z.total_listings / totalListings) * 10000) / 100,
    }))

    // Build pricePerM2ByZone from TIJUANA_ZONES (sorted by price desc)
    const byPrice = [...TIJUANA_ZONES].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
    const pricePerM2ByZone = byPrice.map((z) => ({
      zone_name: z.zone_name,
      zone_slug: z.zone_slug,
      median_price_m2: z.avg_price_per_m2,
      count: z.total_listings,
    }))

    // Composition by type: sum across all zones
    const typeMap: Record<string, number> = {}
    for (const z of TIJUANA_ZONES) {
      for (const [type, count] of Object.entries(z.listings_by_type)) {
        typeMap[type] = (typeMap[type] ?? 0) + (count as number)
      }
    }
    const compositionByType = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count, pct: Math.round((count / totalListings) * 10000) / 100 }))
      .sort((a, b) => b.count - a.count)

    return {
      pricePerM2ByZone,
      priceDistribution: [
        { range: "<1M", count: 160, pct: Math.round((160 / totalListings) * 10000) / 100 },
        { range: "1M-3M", count: 481, pct: Math.round((481 / totalListings) * 10000) / 100 },
        { range: "3M-5M", count: 401, pct: Math.round((401 / totalListings) * 10000) / 100 },
        { range: "5M-10M", count: 321, pct: Math.round((321 / totalListings) * 10000) / 100 },
        { range: "10M-20M", count: 176, pct: Math.round((176 / totalListings) * 10000) / 100 },
        { range: ">20M", count: totalListings - 160 - 481 - 401 - 321 - 176, pct: Math.round(((totalListings - 160 - 481 - 401 - 321 - 176) / totalListings) * 10000) / 100 },
      ],
      compositionByType,
      offerConcentration,
      totalListings,
      medianPrice: 3850000,
      avgPrice: 4200000,
    }
  }

  // Compute analytics from filtered mock listings
  const totalListings = filtered.length
  const withPrice = filtered.filter((l) => l.price > 0)
  const medianPrice = median(withPrice.map((l) => l.price))
  const avgPrice = withPrice.length > 0 ? Math.round(withPrice.reduce((s, l) => s + l.price, 0) / withPrice.length) : 0

  // pricePerM2ByZone
  const zoneMap = new Map<string, { name: string; slug: string; values: number[] }>()
  for (const l of filtered) {
    if (l.price > 0 && l.area_m2 > 0) {
      const zone = MOCK_ZONE_LOOKUP.get(l.zone_id)
      if (zone) {
        if (!zoneMap.has(zone.slug)) zoneMap.set(zone.slug, { ...zone, values: [] })
        zoneMap.get(zone.slug)!.values.push(l.price / l.area_m2)
      }
    }
  }
  const pricePerM2ByZone = Array.from(zoneMap.values())
    .map((z) => ({ zone_name: z.name, zone_slug: z.slug, median_price_m2: Math.round(median(z.values)), count: z.values.length }))
    .sort((a, b) => b.median_price_m2 - a.median_price_m2)

  // priceDistribution (dynamic ranges based on listing type)
  const ranges = getPriceRanges(filters?.listing_type)
  const priceDistribution = ranges.map((r) => {
    const count = withPrice.filter((l) => l.price >= r.min && l.price < r.max).length
    return { range: r.label, count, pct: pct(count, withPrice.length) }
  })

  // compositionByType
  const typeCount = new Map<string, number>()
  for (const l of filtered) {
    typeCount.set(l.property_type, (typeCount.get(l.property_type) ?? 0) + 1)
  }
  const compositionByType = Array.from(typeCount.entries())
    .map(([type, count]) => ({ type, count, pct: pct(count, totalListings) }))
    .sort((a, b) => b.count - a.count)

  // offerConcentration
  const zoneCountMap = new Map<string, { name: string; slug: string; count: number }>()
  for (const l of filtered) {
    const zone = MOCK_ZONE_LOOKUP.get(l.zone_id)
    if (zone) {
      if (!zoneCountMap.has(zone.slug)) zoneCountMap.set(zone.slug, { ...zone, count: 0 })
      zoneCountMap.get(zone.slug)!.count++
    }
  }
  const offerConcentration = Array.from(zoneCountMap.values())
    .map((z) => ({ zone_name: z.name, zone_slug: z.slug, count: z.count, pct: pct(z.count, totalListings) }))
    .sort((a, b) => b.count - a.count)

  return { pricePerM2ByZone, priceDistribution, compositionByType, offerConcentration, totalListings, medianPrice, avgPrice }
}

function mockZoneListingsAnalytics(): ZoneListingsAnalytics {
  return {
    priceByBedrooms: [
      { bedrooms: 1, casa_median: null, depto_median: 1800000, casa_count: 0, depto_count: 32 },
      { bedrooms: 2, casa_median: 3200000, depto_median: 2600000, casa_count: 18, depto_count: 65 },
      { bedrooms: 3, casa_median: 4800000, depto_median: 3500000, casa_count: 42, depto_count: 38 },
      { bedrooms: 4, casa_median: 6500000, depto_median: 5200000, casa_count: 25, depto_count: 12 },
    ],
    typeComparison: [
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

export async function getListingsAnalytics(filters: ListingFilters = {}): Promise<ListingsAnalytics> {
  if (useMock()) return mockListingsAnalytics(filters)

  try {
    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from("listings")
      .select("price_mxn, price_usd, area_m2, property_type, listing_type, bedrooms, zone_id, zones!inner(name, slug)")
      .eq("is_active", true)

    // Apply filters at query level (resolve categoria into property types)
    const catTypes: Record<PropertyCategory, PropertyType[]> = { residencial: RESIDENTIAL_TYPES, comercial: COMMERCIAL_TYPES, terreno: LAND_TYPES }
    if (filters.categoria && filters.tipos?.length) {
      const intersection = filters.tipos.filter((t) => catTypes[filters.categoria!].includes(t))
      query = query.in("property_type", intersection.length > 0 ? intersection : catTypes[filters.categoria])
    } else if (filters.categoria) {
      query = query.in("property_type", catTypes[filters.categoria])
    } else if (filters.tipos?.length) {
      query = query.in("property_type", filters.tipos)
    }
    if (filters.listing_type) query = query.eq("listing_type", filters.listing_type)
    if (filters.zonas?.length) {
      const ids = await resolveZoneSlugs(filters.zonas)
      if (ids.length) query = query.in("zone_id", ids)
    }
    // Price filters applied post-fetch after USD→MXN conversion
    if (filters.precio_min != null || filters.precio_max != null) {
      query = query.or("price_mxn.gt.0,price_usd.gt.0")
    }
    if (filters.area_min != null) query = query.gte("area_m2", filters.area_min)
    if (filters.area_max != null) query = query.lte("area_m2", filters.area_max)
    if (filters.recamaras?.length) {
      // Sanitize: only allow valid bedroom values [1,2,3,4]
      const safeRec = filters.recamaras.filter((r) => Number.isInteger(r) && r >= 1 && r <= 4)
      if (safeRec.length) {
        const has4plus = safeRec.includes(4)
        const exact = safeRec.filter((r) => r < 4)
        if (has4plus && exact.length) {
          query = query.or(`bedrooms.gte.4,bedrooms.in.(${exact.join(",")})`)
        } else if (has4plus) {
          query = query.gte("bedrooms", 4)
        } else {
          query = query.in("bedrooms", exact)
        }
      }
    }

    const { data, error } = await query

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) return mockListingsAnalytics(filters)

    type Row = {
      price_mxn: number | null
      price_usd: number | null
      area_m2: number | null
      property_type: string
      listing_type?: string
      zone_id: string
      zones: { name: string; slug: string } | null
    }

    // Add effective price (USD→MXN converted) to each row
    const rowsWithPrice = (rows as unknown as Row[]).map((l) => ({
      ...l,
      price: effectivePriceMxn(l.price_mxn, l.price_usd) ?? 0,
    }))

    // Normalize: filter out suspected misclassified rentals
    let listings = filterNormalizedListings(rowsWithPrice)

    // Post-fetch price filters (applied here because USD→MXN conversion happens above)
    if (filters.precio_min != null) {
      listings = listings.filter((l) => l.price >= filters.precio_min!)
    }
    if (filters.precio_max != null) {
      listings = listings.filter((l) => l.price <= filters.precio_max!)
    }

    // Category filter
    if (filters.categoria) {
      listings = filterByCategory(listings, filters.categoria)
    }

    if (listings.length === 0) return mockListingsAnalytics(filters)

    // --- totalListings, medianPrice & avgPrice ---
    const withPrice = listings.filter((l) => l.price > 0)
    const totalListings = listings.length
    const medianPrice = median(withPrice.map((l) => l.price))
    const avgPrice = withPrice.length > 0 ? Math.round(withPrice.reduce((s, l) => s + l.price, 0) / withPrice.length) : 0

    // --- pricePerM2ByZone ---
    const zoneMap = new Map<string, { name: string; slug: string; values: number[] }>()
    for (const l of listings) {
      if (l.price > 0 && (l.area_m2 ?? 0) > 0 && l.zones) {
        const key = l.zones.slug
        if (!zoneMap.has(key)) zoneMap.set(key, { name: l.zones.name, slug: l.zones.slug, values: [] })
        zoneMap.get(key)!.values.push(l.price / l.area_m2!)
      }
    }
    const pricePerM2ByZone = Array.from(zoneMap.values())
      .map((z) => ({ zone_name: z.name, zone_slug: z.slug, median_price_m2: Math.round(median(z.values)), count: z.values.length }))
      .sort((a, b) => b.median_price_m2 - a.median_price_m2)

    // --- priceDistribution (dynamic ranges based on listing type) ---
    const ranges = getPriceRanges(filters?.listing_type)
    const priceDistribution = ranges.map((r) => {
      const count = withPrice.filter((l) => l.price >= r.min && l.price < r.max).length
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

    return { pricePerM2ByZone, priceDistribution, compositionByType, offerConcentration, totalListings, medianPrice, avgPrice }
  } catch {
    return mockListingsAnalytics()
  }
}

/* ---------- getZoneListingsAnalytics ---------- */

export async function getZoneListingsAnalytics(slug: string, filters?: ListingFilters): Promise<ZoneListingsAnalytics> {
  if (useMock()) return mockZoneListingsAnalytics()

  try {
    const supabase = await createSupabaseServerClient()
    let zlaQuery = supabase
      .from("listings")
      .select("title, price_mxn, price_usd, area_m2, property_type, listing_type, bedrooms, zones!inner(slug)")
      .eq("is_active", true)
      .eq("zones.slug", slug)

    // Apply listing_type and categoria filters at query level
    if (filters?.listing_type) zlaQuery = zlaQuery.eq("listing_type", filters.listing_type)
    const zlaCatTypes: Record<PropertyCategory, PropertyType[]> = { residencial: RESIDENTIAL_TYPES, comercial: COMMERCIAL_TYPES, terreno: LAND_TYPES }
    if (filters?.categoria) zlaQuery = zlaQuery.in("property_type", zlaCatTypes[filters.categoria])
    else if (filters?.tipos?.length) zlaQuery = zlaQuery.in("property_type", filters.tipos)

    const { data, error } = await zlaQuery

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) return mockZoneListingsAnalytics()

    type Row = {
      title: string | null
      price_mxn: number | null
      price_usd: number | null
      area_m2: number | null
      property_type: string
      listing_type?: string
      bedrooms: number | null
      zones: { slug: string } | null
    }

    // Add effective price (USD→MXN converted) to each row
    const rowsWithPrice = (rows as unknown as Row[]).map((l) => ({
      ...l,
      price: effectivePriceMxn(l.price_mxn, l.price_usd) ?? 0,
    }))

    // Normalize: filter out suspected misclassified rentals
    const listings = filterNormalizedListings(rowsWithPrice)
    if (listings.length === 0) return mockZoneListingsAnalytics()

    // --- priceByBedrooms (only for residencial) ---
    const isResidencial = !filters?.categoria || filters.categoria === "residencial"
    const priceByBedrooms = isResidencial
      ? [1, 2, 3, 4].map((br) => {
          const casas = listings.filter((l) => l.property_type === "casa" && l.bedrooms === br && l.price > 0)
          const deptos = listings.filter((l) => l.property_type === "departamento" && l.bedrooms === br && l.price > 0)
          return {
            bedrooms: br,
            casa_median: casas.length > 0 ? Math.round(median(casas.map((l) => l.price))) : null,
            depto_median: deptos.length > 0 ? Math.round(median(deptos.map((l) => l.price))) : null,
            casa_count: casas.length,
            depto_count: deptos.length,
          }
        })
      : null

    // --- typeComparison (category-aware) ---
    const comparisonTypes: string[] =
      filters?.categoria === "comercial" ? ["local", "oficina"] :
      filters?.categoria === "terreno" ? [] :
      ["casa", "departamento"]

    const typeComparison = comparisonTypes.map((type) => {
      const items = listings.filter((l) => l.property_type === type && l.price > 0 && (l.area_m2 ?? 0) > 0)
      const medPrice = Math.round(median(items.map((l) => l.price)))
      const medArea = Math.round(median(items.map((l) => l.area_m2!)))
      const medPriceM2 = Math.round(median(items.map((l) => l.price / l.area_m2!)))
      return { type, median_price: medPrice, median_area: medArea, median_price_m2: medPriceM2, count: items.length }
    })

    // --- scatterData ---
    const scatterData = listings
      .filter((l) => l.price > 0 && (l.area_m2 ?? 0) > 0)
      .map((l) => ({
        price: l.price,
        area: l.area_m2!,
        type: l.property_type,
        title: l.title ?? "",
      }))

    return { priceByBedrooms, typeComparison, scatterData }
  } catch {
    return mockZoneListingsAnalytics()
  }
}
