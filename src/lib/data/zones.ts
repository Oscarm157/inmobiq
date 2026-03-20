import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  TIJUANA_ZONES,
  TIJUANA_CITY_METRICS,
} from "@/lib/mock-data"
import type { Zone, Snapshot, CitySnapshot, ZoneMetrics, CityMetrics, PropertyType } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

/** Compute median of a numeric array (0 for empty arrays). */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Raw snapshot row as stored in Supabase (one row per zone+property_type+listing_type) */
interface RealSnapshot {
  zone_id: string;
  week_start: string;
  property_type: PropertyType;
  listing_type: string;
  count_active: number;
  avg_price: number;
  avg_price_per_m2: number;
}

export async function getZoneMetrics(filters?: ListingFilters): Promise<ZoneMetrics[]> {
  if (useMock()) {
    let zones = TIJUANA_ZONES
    // Apply zone filter to mock data
    if (filters?.zonas?.length) {
      zones = zones.filter((z) => filters.zonas!.includes(z.zone_slug))
    }
    // Apply property type filter: recalculate total_listings from listings_by_type
    if (filters?.tipos?.length) {
      zones = zones.map((z) => {
        const filteredTotal = filters.tipos!.reduce((sum, t) => sum + (z.listings_by_type[t] ?? 0), 0)
        return { ...z, total_listings: filteredTotal }
      }).filter((z) => z.total_listings > 0)
    }
    return zones
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Get the two most recent distinct snapshot weeks
    const weeksRes = await supabase
      .from("snapshots")
      .select("week_start")
      .order("week_start", { ascending: false })
      .limit(20) // fetch enough to find 2 distinct weeks

    const allWeeks = weeksRes.data as Array<{ week_start: string }> | null
    if (!allWeeks?.length) return TIJUANA_ZONES

    const distinctWeeks = [...new Set(allWeeks.map((w) => w.week_start))]
    const latestWeek = distinctWeeks[0]
    const prevWeek = distinctWeeks[1] ?? null

    // Build filtered listings query
    let listingsQuery = supabase
      .from("listings")
      .select("zone_id, price_mxn, area_m2")
      .eq("is_active", true)
      .gt("price_mxn", 0)
      .gt("area_m2", 10)
      .lt("area_m2", 50000)

    // Build filtered snapshots query
    let latestSnapsQuery = supabase
      .from("snapshots")
      .select("zone_id, week_start, property_type, listing_type, count_active, avg_price, avg_price_per_m2")
      .eq("week_start", latestWeek)

    // Apply filters
    if (filters?.tipos?.length) {
      listingsQuery = listingsQuery.in("property_type", filters.tipos)
      latestSnapsQuery = latestSnapsQuery.in("property_type", filters.tipos)
    }
    if (filters?.listing_type) {
      listingsQuery = listingsQuery.eq("listing_type", filters.listing_type)
      latestSnapsQuery = latestSnapsQuery.eq("listing_type", filters.listing_type)
    }
    if (filters?.precio_min != null) listingsQuery = listingsQuery.gte("price_mxn", filters.precio_min)
    if (filters?.precio_max != null) listingsQuery = listingsQuery.lte("price_mxn", filters.precio_max)
    if (filters?.area_min != null) listingsQuery = listingsQuery.gte("area_m2", filters.area_min)
    if (filters?.area_max != null) listingsQuery = listingsQuery.lte("area_m2", filters.area_max)
    if (filters?.recamaras?.length) {
      const has4plus = filters.recamaras.includes(4)
      const exact = filters.recamaras.filter((r) => r < 4)
      if (has4plus && exact.length) {
        listingsQuery = listingsQuery.or(`bedrooms.gte.4,bedrooms.in.(${exact.join(",")})`)
      } else if (has4plus) {
        listingsQuery = listingsQuery.gte("bedrooms", 4)
      } else {
        listingsQuery = listingsQuery.in("bedrooms", exact)
      }
    }

    // Resolve zone filter to IDs
    let filterZoneIds: string[] | null = null
    if (filters?.zonas?.length) {
      const { data: zoneRows } = await supabase
        .from("zones")
        .select("id")
        .in("slug", filters.zonas)
      filterZoneIds = (zoneRows ?? []).map((z: { id: string }) => z.id)
      if (filterZoneIds.length) {
        listingsQuery = listingsQuery.in("zone_id", filterZoneIds)
        latestSnapsQuery = latestSnapsQuery.in("zone_id", filterZoneIds)
      }
    }

    // Fetch zones, snapshots, and individual listings in parallel
    const [zonesRes, latestSnapsRes, prevSnapsRes, listingsRes] = await Promise.all([
      supabase.from("zones").select("*"),
      latestSnapsQuery,
      prevWeek
        ? supabase
            .from("snapshots")
            .select("zone_id, avg_price_per_m2, count_active")
            .eq("week_start", prevWeek)
        : Promise.resolve({ data: [] }),
      listingsQuery,
    ])

    const zones = zonesRes.data as Zone[] | null
    const latestSnaps = latestSnapsRes.data as RealSnapshot[] | null
    const prevSnaps = prevSnapsRes.data as Array<{ zone_id: string; avg_price_per_m2: number; count_active: number }> | null
    const listingsData = listingsRes.data as Array<{ zone_id: string; price_mxn: number; area_m2: number }> | null

    if (!zones?.length || !latestSnaps?.length) {
      // Apply basic filters to mock fallback
      let fallback = TIJUANA_ZONES
      if (filters?.zonas?.length) {
        fallback = fallback.filter((z) => filters.zonas!.includes(z.zone_slug))
      }
      if (filters?.tipos?.length) {
        fallback = fallback.map((z) => {
          const filteredTotal = filters.tipos!.reduce((sum, t) => sum + (z.listings_by_type[t] ?? 0), 0)
          return { ...z, total_listings: filteredTotal }
        }).filter((z) => z.total_listings > 0)
      }
      return fallback
    }

    // Build median price/m² lookup from individual listings
    const medianPriceByZone = new Map<string, number>()
    if (listingsData?.length) {
      const grouped = new Map<string, number[]>()
      for (const l of listingsData) {
        if (l.area_m2 > 0 && l.price_mxn > 0) {
          const arr = grouped.get(l.zone_id) ?? []
          arr.push(l.price_mxn / l.area_m2)
          grouped.set(l.zone_id, arr)
        }
      }
      for (const [zoneId, values] of grouped) {
        medianPriceByZone.set(zoneId, Math.round(median(values)))
      }
    }

    // Aggregate snapshots per zone
    const result: ZoneMetrics[] = zones
      .map((zone) => {
        const zoneSnaps = latestSnaps.filter((s) => s.zone_id === zone.id)
        if (!zoneSnaps.length) return null

        // Sum count_active across all property_type/listing_type combos
        const totalListings = zoneSnaps.reduce((sum, s) => sum + Number(s.count_active), 0)

        // Weighted avg price per m2 (fallback when no listings available)
        const totalWeighted = zoneSnaps.reduce(
          (sum, s) => sum + Number(s.avg_price_per_m2) * Number(s.count_active), 0
        )
        const snapshotAvgPricePerM2 = totalListings > 0 ? totalWeighted / totalListings : 0

        // Use median from listings for consistency with analytics pages
        const avgPricePerM2 = medianPriceByZone.get(zone.id) ?? Math.round(snapshotAvgPricePerM2)

        // Weighted avg ticket (avg_price)
        const totalTicket = zoneSnaps.reduce(
          (sum, s) => sum + Number(s.avg_price) * Number(s.count_active), 0
        )
        const avgTicket = totalListings > 0 ? totalTicket / totalListings : 0

        // listings_by_type: aggregate count_active per property_type
        const listingsByType: Record<string, number> = {}
        const ticketByType: Record<string, number> = {}
        for (const s of zoneSnaps) {
          const pt = s.property_type
          listingsByType[pt] = (listingsByType[pt] ?? 0) + Number(s.count_active)
          // weighted avg ticket per type
          const existing = ticketByType[pt] ?? 0
          ticketByType[pt] = existing + Number(s.avg_price) * Number(s.count_active)
        }
        // Normalize ticket by type
        for (const pt of Object.keys(ticketByType)) {
          const count = listingsByType[pt] ?? 1
          ticketByType[pt] = count > 0 ? ticketByType[pt] / count : 0
        }

        // Price trend vs previous week
        const prevZoneSnaps = prevSnaps?.filter((s) => s.zone_id === zone.id) ?? []
        let priceTrend = 0
        if (prevZoneSnaps.length > 0) {
          const prevTotal = prevZoneSnaps.reduce((s, p) => s + Number(p.count_active), 0)
          const prevWeighted = prevZoneSnaps.reduce(
            (s, p) => s + Number(p.avg_price_per_m2) * Number(p.count_active), 0
          )
          const prevAvg = prevTotal > 0 ? prevWeighted / prevTotal : 0
          if (prevAvg > 0) {
            priceTrend = ((avgPricePerM2 - prevAvg) / prevAvg) * 100
          }
        }

        return {
          zone_id: zone.id,
          zone_name: zone.name,
          zone_slug: zone.slug,
          avg_price_per_m2: avgPricePerM2,
          price_trend_pct: Number(priceTrend.toFixed(1)),
          avg_ticket: Math.round(avgTicket),
          total_listings: totalListings,
          listings_by_type: listingsByType as Record<PropertyType, number>,
          avg_ticket_by_type: ticketByType as Record<PropertyType, number>,
        } satisfies ZoneMetrics
      })
      .filter(Boolean) as ZoneMetrics[]

    if (result.length === 0) return filters?.zonas?.length ? [] : TIJUANA_ZONES

    // Filter output zones if zone filter active
    if (filterZoneIds?.length) {
      return result.filter((z) => filterZoneIds!.includes(z.zone_id))
    }
    return result
  } catch {
    return TIJUANA_ZONES
  }
}

export async function getZoneBySlug(slug: string): Promise<ZoneMetrics | null> {
  const zones = await getZoneMetrics()
  return zones.find((z) => z.zone_slug === slug) ?? null
}

export async function getCityMetrics(filters?: ListingFilters): Promise<CityMetrics> {
  const zones = await getZoneMetrics(filters)

  const hasFilters = filters && (
    (filters.tipos?.length ?? 0) > 0 || !!filters.listing_type ||
    (filters.zonas?.length ?? 0) > 0 || filters.precio_min != null ||
    filters.precio_max != null || filters.area_min != null ||
    filters.area_max != null || (filters.recamaras?.length ?? 0) > 0
  )

  if (!hasFilters && (useMock() || zones === TIJUANA_ZONES)) {
    return TIJUANA_CITY_METRICS
  }

  // When filters are active, compute city metrics from filtered zones
  if (hasFilters) {
    const totalListings = zones.reduce((s, z) => s + z.total_listings, 0)
    const weightedPrice = zones.reduce((s, z) => s + z.avg_price_per_m2 * z.total_listings, 0)
    const avgPricePerM2 = totalListings > 0 ? Math.round(weightedPrice / totalListings) : 0

    const sortedByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
    const sortedByListings = [...zones].sort((a, b) => b.total_listings - a.total_listings)

    return {
      city: "Tijuana",
      avg_price_per_m2: avgPricePerM2,
      price_trend_pct: zones.length > 0
        ? Number((zones.reduce((s, z) => s + z.price_trend_pct, 0) / zones.length).toFixed(1))
        : 0,
      total_listings: totalListings,
      total_zones: zones.length,
      top_zones: sortedByPrice.slice(0, 4),
      hottest_zones: sortedByListings.slice(0, 4),
    }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const citySnapsRes = await supabase
      .from("city_snapshots")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(2)

    const latestCity = citySnapsRes.data as Array<{
      id: string; city: string; week_start: string;
      avg_price_per_m2: number; count_active: number; total_zones: number;
    }> | null

    if (!latestCity?.length) return TIJUANA_CITY_METRICS

    const [latest, prev] = latestCity
    const priceTrend = prev && Number(prev.avg_price_per_m2) > 0
      ? ((Number(latest.avg_price_per_m2) - Number(prev.avg_price_per_m2)) /
          Number(prev.avg_price_per_m2)) *
        100
      : 0

    const sortedByPrice = [...zones].sort(
      (a, b) => b.avg_price_per_m2 - a.avg_price_per_m2
    )
    const sortedByListings = [...zones].sort(
      (a, b) => b.total_listings - a.total_listings
    )

    return {
      city: latest.city ?? "Tijuana",
      avg_price_per_m2: Number(latest.avg_price_per_m2),
      price_trend_pct: Number(priceTrend.toFixed(1)),
      total_listings: latest.count_active ?? 0,
      total_zones: latest.total_zones ?? zones.length,
      top_zones: sortedByPrice.slice(0, 4),
      hottest_zones: sortedByListings.slice(0, 4),
    }
  } catch {
    return TIJUANA_CITY_METRICS
  }
}
