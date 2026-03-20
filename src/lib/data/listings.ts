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
      .select("id, zone_id, title, property_type, listing_type, price_mxn, price_usd, area_m2, bedrooms, bathrooms, source_portal, external_url, scraped_at, created_at")
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
    }))

    return listings.length > 0
      ? { listings, total: listings.length }
      : applyMockFilters(filters)
  } catch {
    return applyMockFilters(filters)
  }
}
