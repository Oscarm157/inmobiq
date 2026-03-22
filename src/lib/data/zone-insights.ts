/**
 * Cross-referenced indicators: INEGI demographics × real estate market data.
 * Combines ZoneDemographics with ZoneMetrics to produce investment-grade insights.
 */

import type { ZoneDemographics } from "./demographics"
import type { ZoneMetrics, ZoneRiskMetrics } from "@/types/database"

export interface ZoneInsights {
  zone_slug: string
  /** 0-100 — higher = more affordable relative to socioeconomic level */
  affordability_index: number
  affordability_label: string
  /** 0-100 — higher = more demand pressure (households/inventory × economic activity) */
  demand_pressure: number
  demand_label: string
  /** 0-100 — higher = stronger demographic fundamentals for appreciation */
  appreciation_potential: number
  appreciation_label: string
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, val)))
}

function labelFromScore(score: number, labels: [string, string, string, string]): string {
  if (score >= 75) return labels[0]
  if (score >= 50) return labels[1]
  if (score >= 25) return labels[2]
  return labels[3]
}

/**
 * Compute cross-referenced insights for a single zone.
 * Returns null if demographics or metrics are missing.
 */
export function computeZoneInsights(
  demo: ZoneDemographics | null,
  metrics: ZoneMetrics | null,
  risk: ZoneRiskMetrics | null,
  allMetrics: ZoneMetrics[]
): ZoneInsights | null {
  if (!demo || !metrics || demo.ageb_count === 0) return null

  // --- Affordability Index ---
  // High price + low NSE = low affordability
  // Normalize price relative to city max
  const maxPrice = Math.max(...allMetrics.map((m) => m.avg_price_per_m2), 1)
  const priceNorm = (metrics.avg_price_per_m2 / maxPrice) * 100
  const nse = demo.nse_score
  // Affordability = how much NSE "covers" the price level
  // If NSE is high and price is low → very affordable (high score)
  const affordability = nse > 0
    ? clamp(100 - (priceNorm - nse * 0.8))
    : 0

  // --- Demand Pressure ---
  // households/listings ratio × economic participation
  const householdRatio = metrics.total_listings > 0
    ? Math.min(demo.households / metrics.total_listings, 500)
    : 0
  const maxRatio = 500
  const ratioNorm = (householdRatio / maxRatio) * 100
  const econNorm = demo.economic_participation // already 0-100ish (typically 40-70)
  const inetNorm = demo.pct_internet // 0-100
  const demand = clamp(ratioNorm * 0.50 + econNorm * 0.30 + inetNorm * 0.20)

  // --- Appreciation Potential ---
  // Strong fundamentals (NSE, connectivity, economic activity) + low volatility
  const volatilityPenalty = risk ? Math.min(risk.volatility * 2, 30) : 10
  const fundamentals = clamp(
    nse * 0.35 +
    inetNorm * 0.25 +
    (demo.economic_participation * 1.2) * 0.25 + // scale participation to ~0-100
    (demo.pct_car * 0.15)
  )
  const appreciation = clamp(fundamentals - volatilityPenalty)

  return {
    zone_slug: demo.zone_slug,
    affordability_index: affordability,
    affordability_label: labelFromScore(affordability, [
      "Muy asequible",
      "Asequible",
      "Costosa para el NSE",
      "Muy costosa para el NSE",
    ]),
    demand_pressure: demand,
    demand_label: labelFromScore(demand, [
      "Demanda muy alta",
      "Demanda alta",
      "Demanda moderada",
      "Demanda baja",
    ]),
    appreciation_potential: appreciation,
    appreciation_label: labelFromScore(appreciation, [
      "Alto potencial",
      "Potencial moderado",
      "Potencial limitado",
      "Bajo potencial",
    ]),
  }
}
