/**
 * Cross-referenced indicators: INEGI demographics × real estate market data.
 * Combines ZoneDemographics with ZoneMetrics to produce investment-grade insights.
 */

import type { ZoneDemographics } from "./demographics"
import type { Listing, ZoneMetrics, ZoneRiskMetrics } from "@/types/database"
import type { RentalAttributeStats } from "./rental-attributes"

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
  // Normalize price relative to city median (more robust than max)
  const prices = allMetrics.map((m) => m.avg_price_per_m2).sort((a, b) => a - b)
  const medianPrice = prices.length > 0
    ? prices[Math.floor(prices.length / 2)]
    : 1
  // Ratio > 1 means above median price, < 1 means below
  const priceRatio = metrics.avg_price_per_m2 / Math.max(medianPrice, 1)
  const nse = demo.nse_score
  // nseNorm: 0-100 rescaled so median NSE (~55) maps to ~0.5
  const nseNorm = nse / 100
  // Affordability = NSE capacity vs price level
  // ratio approach: high NSE + low price → high score, but capped by price level
  // priceRatio of 2.0 means twice the median → expensive
  // nseNorm of 0.65 means above-average socioeconomic level
  const affordability = nse > 0
    ? clamp(Math.round((nseNorm / Math.max(priceRatio, 0.3)) * 80))
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

/* ------------------------------------------------------------------ */
/*  Rental-specific insights                                           */
/* ------------------------------------------------------------------ */

export interface RentalInsights {
  /** 0-100 — higher = more rental demand */
  rental_demand_score: number
  rental_demand_label: string
  /** % premium for furnished vs unfurnished (from extracted attributes) */
  furnished_premium_pct: number | null
  /** % of rental listings originally listed in USD */
  usd_market_share_pct: number
  /** Average days a rental listing stays active (proxy for demand) */
  avg_listing_duration_days: number | null
  /** Qualitative rental velocity */
  rental_velocity: "alta" | "media" | "baja"
}

/**
 * Compute rental-specific insights for a zone.
 * Uses listing activity data and extracted rental attributes.
 */
export function computeRentalInsights(
  rentaListings: Listing[],
  demo: ZoneDemographics | null,
  rentalStats: RentalAttributeStats | null,
  currencyMix: { pctUsd: number },
): RentalInsights | null {
  if (rentaListings.length < 3) return null

  // Average listing duration (days between scraped_at or created_at — proxy for how fast listings move)
  const durations: number[] = []
  const now = Date.now()
  for (const l of rentaListings) {
    const created = new Date(l.scraped_at || l.created_at).getTime()
    if (created > 0) {
      const daysActive = (now - created) / (1000 * 60 * 60 * 24)
      if (daysActive > 0 && daysActive < 365) durations.push(daysActive)
    }
  }
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null

  // Rental velocity
  const velocity: RentalInsights["rental_velocity"] = avgDuration !== null
    ? (avgDuration < 14 ? "alta" : avgDuration < 30 ? "media" : "baja")
    : "media"

  // Rental demand score: combine household ratio, duration, NSE internet (digital nomad appeal)
  let demandScore = 50 // neutral default
  if (demo && demo.ageb_count > 0) {
    const householdToListingRatio = Math.min(demo.households / Math.max(rentaListings.length, 1), 500)
    const ratioNorm = (householdToListingRatio / 500) * 100
    const durationScore = avgDuration !== null
      ? clamp(Math.round(100 - avgDuration * 2)) // shorter = higher score
      : 50
    const internetAppeal = demo.pct_internet // 0-100
    demandScore = clamp(Math.round(ratioNorm * 0.35 + durationScore * 0.35 + internetAppeal * 0.30))
  }

  return {
    rental_demand_score: demandScore,
    rental_demand_label: labelFromScore(demandScore, [
      "Demanda muy alta",
      "Demanda alta",
      "Demanda moderada",
      "Demanda baja",
    ]),
    furnished_premium_pct: rentalStats?.furnishedPremiumPct !== null && rentalStats?.furnishedPremiumPct !== undefined
      ? Math.round(rentalStats.furnishedPremiumPct * 10) / 10
      : null,
    usd_market_share_pct: currencyMix.pctUsd,
    avg_listing_duration_days: avgDuration !== null ? Math.round(avgDuration) : null,
    rental_velocity: velocity,
  }
}
