import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  TIJUANA_ZONES,
  TIJUANA_CITY_METRICS,
} from "@/lib/mock-data"
import type { Zone, Snapshot, CitySnapshot, ZoneMetrics, CityMetrics, PropertyType } from "@/types/database"

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

export async function getZoneMetrics(): Promise<ZoneMetrics[]> {
  if (useMock()) return TIJUANA_ZONES

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

    // Fetch zones, snapshots, and individual listings in parallel
    const [zonesRes, latestSnapsRes, prevSnapsRes, listingsRes] = await Promise.all([
      supabase.from("zones").select("*"),
      supabase
        .from("snapshots")
        .select("zone_id, week_start, property_type, listing_type, count_active, avg_price, avg_price_per_m2")
        .eq("week_start", latestWeek),
      prevWeek
        ? supabase
            .from("snapshots")
            .select("zone_id, avg_price_per_m2, count_active")
            .eq("week_start", prevWeek)
        : Promise.resolve({ data: [] }),
      // Fetch individual listings for median price/m² (consistent with analytics)
      supabase
        .from("listings")
        .select("zone_id, price_mxn, area_m2")
        .eq("is_active", true)
        .gt("price_mxn", 0)
        .gt("area_m2", 10)   // filter outlier areas (< 10 m²)
        .lt("area_m2", 50000), // filter outlier areas (> 50,000 m²)
    ])

    const zones = zonesRes.data as Zone[] | null
    const latestSnaps = latestSnapsRes.data as RealSnapshot[] | null
    const prevSnaps = prevSnapsRes.data as Array<{ zone_id: string; avg_price_per_m2: number; count_active: number }> | null
    const listingsData = listingsRes.data as Array<{ zone_id: string; price_mxn: number; area_m2: number }> | null

    if (!zones?.length || !latestSnaps?.length) return TIJUANA_ZONES

    // Build median price/m² lookup from individual listings
    const medianPriceByZone = new Map<string, number>()
    if (listingsData?.length) {
      const grouped = new Map<string, number[]>()
      for (const l of listingsData) {
        const arr = grouped.get(l.zone_id) ?? []
        arr.push(l.price_mxn / l.area_m2)
        grouped.set(l.zone_id, arr)
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

    return result.length > 0 ? result : TIJUANA_ZONES
  } catch {
    return TIJUANA_ZONES
  }
}

export async function getZoneBySlug(slug: string): Promise<ZoneMetrics | null> {
  const zones = await getZoneMetrics()
  return zones.find((z) => z.zone_slug === slug) ?? null
}

export async function getCityMetrics(): Promise<CityMetrics> {
  const zones = await getZoneMetrics()

  if (useMock() || zones === TIJUANA_ZONES) {
    return TIJUANA_CITY_METRICS
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
    const priceTrend = prev
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
