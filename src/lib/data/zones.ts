import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  TIJUANA_ZONES,
  TIJUANA_CITY_METRICS,
} from "@/lib/mock-data"
import type { Zone, Snapshot, CitySnapshot, ZoneMetrics, CityMetrics, PropertyType } from "@/types/database"

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

export async function getZoneMetrics(): Promise<ZoneMetrics[]> {
  if (useMock()) return TIJUANA_ZONES

  try {
    const supabase = await createSupabaseServerClient()

    // Get the two most recent snapshot weeks
    const weeksRes = await supabase
      .from("snapshots")
      .select("week_start")
      .order("week_start", { ascending: false })
      .limit(2)

    const weeks = weeksRes.data as Array<{ week_start: string }> | null

    if (!weeks?.length) return TIJUANA_ZONES

    const [latestWeek, prevWeek] = weeks

    // Fetch zones and their snapshots in parallel
    const [zonesRes, latestSnapsRes, prevSnapsRes] = await Promise.all([
      supabase.from("zones").select("*").eq("city", "Tijuana"),
      supabase
        .from("snapshots")
        .select("*")
        .eq("week_start", latestWeek.week_start),
      prevWeek
        ? supabase
            .from("snapshots")
            .select("zone_id, avg_price_per_m2")
            .eq("week_start", prevWeek.week_start)
        : Promise.resolve({ data: [] }),
    ])

    const zones = zonesRes.data as Zone[] | null
    const latestSnaps = latestSnapsRes.data as Snapshot[] | null
    const prevSnaps = (prevSnapsRes.data as Array<{ zone_id: string; avg_price_per_m2: number }> | null)

    if (!zones?.length || !latestSnaps?.length) return TIJUANA_ZONES

    const result: ZoneMetrics[] = zones
      .map((zone) => {
        const snap = latestSnaps.find((s) => s.zone_id === zone.id)
        if (!snap) return null

        const prevSnap = prevSnaps?.find((s) => s.zone_id === zone.id)
        const priceTrend = prevSnap
          ? ((Number(snap.avg_price_per_m2) - Number(prevSnap.avg_price_per_m2)) /
              Number(prevSnap.avg_price_per_m2)) *
            100
          : 0

        return {
          zone_id: zone.id,
          zone_name: zone.name,
          zone_slug: zone.slug,
          avg_price_per_m2: Number(snap.avg_price_per_m2),
          price_trend_pct: Number(priceTrend.toFixed(1)),
          avg_ticket: Number(snap.avg_ticket),
          total_listings: snap.total_listings,
          listings_by_type: (snap.listings_by_type ?? {}) as Record<PropertyType, number>,
          avg_ticket_by_type: (snap.avg_ticket_by_type ?? {}) as Record<PropertyType, number>,
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

    const latestCity = citySnapsRes.data as CitySnapshot[] | null

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
      total_listings: latest.total_listings,
      total_zones: latest.total_zones ?? zones.length,
      top_zones: sortedByPrice.slice(0, 4),
      hottest_zones: sortedByListings.slice(0, 4),
    }
  } catch {
    return TIJUANA_CITY_METRICS
  }
}
