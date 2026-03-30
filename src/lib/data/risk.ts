import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ZONE_RISK_DATA } from "@/lib/mock-data"
import { getZoneDemographics } from "@/lib/data/demographics"
import { isValidListing, effectivePriceMxn, RESIDENTIAL_TYPES, COMMERCIAL_TYPES, LAND_TYPES, type PropertyCategory } from "@/lib/data/normalize"
import type { Zone, ZoneRiskMetrics, PropertyType, ListingType } from "@/types/database"

export interface RiskFilters {
  categoria?: PropertyCategory
  listing_type?: ListingType
}

function resolveRiskTypes(filters?: RiskFilters): PropertyType[] | undefined {
  if (!filters?.categoria) return undefined
  const map: Record<PropertyCategory, PropertyType[]> = {
    residencial: RESIDENTIAL_TYPES,
    comercial: COMMERCIAL_TYPES,
    terreno: LAND_TYPES,
  }
  return map[filters.categoria]
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

type SnapshotRow = {
  zone_id: string
  week_start: string
  avg_price_per_m2: number
  total_listings: number
}

type RentalListingRow = {
  zone_id: string
  price_mxn: number | null
  price_usd: number | null
  area_m2: number | null
  property_type: string
}

/** Compute avg rent per m² from actual rental listings, keyed by zone_id */
async function computeRealRentPerM2(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  zoneIds: string[],
  propertyTypes?: PropertyType[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>()

  let query = supabase
    .from("listings")
    .select("zone_id, price_mxn, price_usd, area_m2, property_type")
    .eq("listing_type", "renta")
    .eq("is_active", true)
    .in("zone_id", zoneIds)
    .gt("area_m2", 0)

  if (propertyTypes?.length) {
    query = query.in("property_type", propertyTypes)
  }

  const { data: rentals } = await query

  if (!rentals?.length) return result

  // Group by zone and compute avg rent/m²
  const byZone = new Map<string, number[]>()
  for (const row of rentals as RentalListingRow[]) {
    const price = effectivePriceMxn(row.price_mxn, row.price_usd)
    if (!price || !row.area_m2 || row.area_m2 <= 0) continue
    const validation = isValidListing(row.property_type as "casa", "renta", price, row.area_m2)
    if (!validation.isValid) continue
    const rentPerM2 = price / row.area_m2
    const arr = byZone.get(row.zone_id) ?? []
    arr.push(rentPerM2)
    byZone.set(row.zone_id, arr)
  }

  for (const [zoneId, values] of byZone) {
    if (values.length >= 3) {
      result.set(zoneId, values.reduce((a, b) => a + b, 0) / values.length)
    }
  }

  return result
}

/**
 * Returns risk metrics per zone.
 * Real data: computed from snapshot history (volatility = price std dev over 4 weeks).
 * Falls back to mock when insufficient snapshot history exists.
 */
export async function getZoneRiskMetrics(filters?: RiskFilters): Promise<{ data: ZoneRiskMetrics[]; isMock: boolean }> {
  if (useMock()) return { data: ZONE_RISK_DATA, isMock: true }

  try {
    const supabase = await createSupabaseServerClient()

    // Get last 4 weeks of snapshots to compute volatility
    const weeksRes = await supabase
      .from("snapshots")
      .select("week_start")
      .order("week_start", { ascending: false })
      .limit(4)

    const weeks = weeksRes.data as Array<{ week_start: string }> | null

    if (!weeks || weeks.length < 2) return { data: ZONE_RISK_DATA, isMock: true }

    const weekStarts = weeks.map((w) => w.week_start)

    // Build filtered snapshots query
    let snapsQuery = supabase
      .from("snapshots")
      .select("zone_id, week_start, avg_price_per_m2, total_listings")
      .in("week_start", weekStarts)

    const effectiveTypes = resolveRiskTypes(filters)
    if (effectiveTypes?.length) {
      snapsQuery = snapsQuery.in("property_type", effectiveTypes)
    }
    if (filters?.listing_type) {
      snapsQuery = snapsQuery.eq("listing_type", filters.listing_type)
    }

    const [zonesRes, snapshotsRes] = await Promise.all([
      supabase.from("zones").select("*").eq("city", "Tijuana"),
      snapsQuery,
    ])

    const zones = zonesRes.data as Zone[] | null
    const snapshots = snapshotsRes.data as SnapshotRow[] | null

    if (!zones?.length || !snapshots?.length) return { data: ZONE_RISK_DATA, isMock: true }

    // Compute real avg_rent_per_m2 from active rental listings
    const realRentPerM2 = await computeRealRentPerM2(supabase, zones.map((z) => z.id), effectiveTypes)

    const result: ZoneRiskMetrics[] = zones
      .map((zone) => {
        const zoneSnaps = snapshots
          .filter((s) => s.zone_id === zone.id)
          .sort(
            (a, b) =>
              new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
          )

        if (zoneSnaps.length < 2) return null

        const prices = zoneSnaps.map((s) => Number(s.avg_price_per_m2))
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        const variance =
          prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length
        const stdDev = Math.sqrt(variance)
        const volatility = Number(((stdDev / avg) * 100).toFixed(1))

        // Latest and previous week for trend
        const [latest, prev] = zoneSnaps
        const priceTrend =
          ((Number(latest.avg_price_per_m2) - Number(prev.avg_price_per_m2)) /
            Number(prev.avg_price_per_m2)) *
          100

        // Smoothed trend: weighted average of week-over-week changes (recent weeks weighted more)
        const weeklyTrends: number[] = []
        for (let i = 0; i < zoneSnaps.length - 1; i++) {
          const curr = Number(zoneSnaps[i].avg_price_per_m2)
          const previous = Number(zoneSnaps[i + 1].avg_price_per_m2)
          if (previous > 0) weeklyTrends.push(((curr - previous) / previous) * 100)
        }
        const trendWeights = [0.4, 0.3, 0.2, 0.1]
        let smoothedTrend = priceTrend
        if (weeklyTrends.length >= 2) {
          let weightedSum = 0
          let weightSum = 0
          for (let i = 0; i < weeklyTrends.length && i < trendWeights.length; i++) {
            weightedSum += weeklyTrends[i] * trendWeights[i]
            weightSum += trendWeights[i]
          }
          smoothedTrend = weightedSum / weightSum
        }

        // Derive risk score from snapshot data + demographic factors
        const vacancyProxy = Math.max(0, 10 - priceTrend) * 1.5

        // Demographic risk factor (0-20): low NSE or high unemployment → more risk
        const demo = getZoneDemographics(zone.slug)
        let demoRiskFactor = 10 // neutral default
        if (demo && demo.ageb_count > 0) {
          const nseRisk = Math.max(0, (70 - demo.nse_score) * 0.2) // low NSE adds risk
          const unemploymentRisk = demo.unemployment_rate * 0.5 // high unemployment adds risk
          demoRiskFactor = Math.min(20, Math.round(nseRisk + unemploymentRisk))
        }

        const riskScore = Math.min(
          100,
          Math.round(volatility * 3 + vacancyProxy + demoRiskFactor + 15)
        )
        const capRate = Math.max(3, Math.min(12, 8 - priceTrend * 0.3))
        const liquidityScore = Math.min(
          100,
          Math.round(latest.total_listings * 0.3 + 30)
        )

        const risk_label: ZoneRiskMetrics["risk_label"] =
          riskScore < 40 ? "Bajo" : riskScore < 65 ? "Medio" : "Alto"

        const mockEntry = ZONE_RISK_DATA.find(
          (m) => m.zone_slug === zone.slug
        )

        return {
          zone_slug: zone.slug,
          zone_name: zone.name,
          risk_score: riskScore,
          volatility,
          cap_rate: Number(capRate.toFixed(1)),
          vacancy_rate: Number(vacancyProxy.toFixed(1)),
          liquidity_score: liquidityScore,
          market_maturity:
            mockEntry?.market_maturity ?? "consolidado",
          avg_rent_per_m2: realRentPerM2.get(zone.id) ?? mockEntry?.avg_rent_per_m2 ?? 150,
          risk_label,
          smoothed_trend_pct: Number(smoothedTrend.toFixed(2)),
        } satisfies ZoneRiskMetrics
      })
      .filter(Boolean) as ZoneRiskMetrics[]

    return result.length >= 2 ? { data: result, isMock: false } : { data: ZONE_RISK_DATA, isMock: true }
  } catch {
    return { data: ZONE_RISK_DATA, isMock: true }
  }
}
