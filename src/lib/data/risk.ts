import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ZONE_RISK_DATA } from "@/lib/mock-data"
import type { Zone, ZoneRiskMetrics } from "@/types/database"

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

type SnapshotRow = {
  zone_id: string
  week_start: string
  avg_price_per_m2: number
  total_listings: number
}

/**
 * Returns risk metrics per zone.
 * Real data: computed from snapshot history (volatility = price std dev over 4 weeks).
 * Falls back to mock when insufficient snapshot history exists.
 */
export async function getZoneRiskMetrics(): Promise<ZoneRiskMetrics[]> {
  if (useMock()) return ZONE_RISK_DATA

  try {
    const supabase = await createSupabaseServerClient()

    // Get last 4 weeks of snapshots to compute volatility
    const weeksRes = await supabase
      .from("snapshots")
      .select("week_start")
      .order("week_start", { ascending: false })
      .limit(4)

    const weeks = weeksRes.data as Array<{ week_start: string }> | null

    if (!weeks || weeks.length < 2) return ZONE_RISK_DATA

    const weekStarts = weeks.map((w) => w.week_start)

    const [zonesRes, snapshotsRes] = await Promise.all([
      supabase.from("zones").select("*").eq("city", "Tijuana"),
      supabase
        .from("snapshots")
        .select("zone_id, week_start, avg_price_per_m2, total_listings")
        .in("week_start", weekStarts),
    ])

    const zones = zonesRes.data as Zone[] | null
    const snapshots = snapshotsRes.data as SnapshotRow[] | null

    if (!zones?.length || !snapshots?.length) return ZONE_RISK_DATA

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

        // Derive risk score from snapshot data
        const vacancyProxy = Math.max(0, 10 - priceTrend) * 1.5
        const riskScore = Math.min(
          100,
          Math.round(volatility * 4 + vacancyProxy + 20)
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
          avg_rent_per_m2: mockEntry?.avg_rent_per_m2 ?? 150,
          risk_label,
        } satisfies ZoneRiskMetrics
      })
      .filter(Boolean) as ZoneRiskMetrics[]

    return result.length >= 2 ? result : ZONE_RISK_DATA
  } catch {
    return ZONE_RISK_DATA
  }
}
