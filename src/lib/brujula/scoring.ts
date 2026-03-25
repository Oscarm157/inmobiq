/**
 * Brújula — Scoring algorithm.
 * Compares a single property against zone-level data and produces a 0-100 score.
 *
 * Score interpretation:
 *   0-19  → Muy cara
 *  20-39  → Cara
 *  40-59  → Precio justo
 *  60-79  → Barata
 *  80-100 → Muy barata
 */

import type {
  PropertyType,
  ListingType,
  ValuationVerdict,
  ValuationResult,
} from "@/types/database"
import type { ZoneComparisonData } from "./zone-comparison"

// ── Helpers ──

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function computePercentile(value: number, distribution: number[]): number {
  if (distribution.length === 0) return 50
  const sorted = [...distribution].sort((a, b) => a - b)
  const below = sorted.filter((v) => v < value).length
  return Math.round((below / sorted.length) * 100)
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function verdictFromScore(score: number): ValuationVerdict {
  if (score >= 80) return "muy_barata"
  if (score >= 60) return "barata"
  if (score >= 40) return "precio_justo"
  if (score >= 20) return "cara"
  return "muy_cara"
}

function verdictLabel(v: ValuationVerdict): string {
  const map: Record<ValuationVerdict, string> = {
    muy_barata: "Muy barata",
    barata: "Barata",
    precio_justo: "Precio justo",
    cara: "Cara",
    muy_cara: "Muy cara",
  }
  return map[v]
}

// ── Price distribution for chart ──

interface PriceRange {
  label: string
  min: number
  max: number
}

function getPricePerM2Ranges(listingType: ListingType): PriceRange[] {
  if (listingType === "renta") {
    return [
      { label: "<$50", min: 0, max: 50 },
      { label: "$50-100", min: 50, max: 100 },
      { label: "$100-200", min: 100, max: 200 },
      { label: "$200-400", min: 200, max: 400 },
      { label: "$400-800", min: 400, max: 800 },
      { label: ">$800", min: 800, max: Infinity },
    ]
  }
  return [
    { label: "<$10K", min: 0, max: 10_000 },
    { label: "$10K-20K", min: 10_000, max: 20_000 },
    { label: "$20K-30K", min: 20_000, max: 30_000 },
    { label: "$30K-50K", min: 30_000, max: 50_000 },
    { label: "$50K-80K", min: 50_000, max: 80_000 },
    { label: ">$80K", min: 80_000, max: Infinity },
  ]
}

function buildPriceDistribution(
  listings: { price_per_m2: number }[],
  propertyPricePerM2: number,
  listingType: ListingType,
) {
  const ranges = getPricePerM2Ranges(listingType)
  return ranges.map((r) => {
    const count = listings.filter(
      (l) => l.price_per_m2 >= r.min && l.price_per_m2 < r.max,
    ).length
    const has_property =
      propertyPricePerM2 >= r.min && propertyPricePerM2 < r.max
    return { range: r.label, count, has_property }
  })
}

// ── Main scoring ──

export interface PropertyInput {
  price_mxn: number
  area_m2: number
  property_type: PropertyType
  listing_type: ListingType
  bedrooms: number | null
  bathrooms: number | null
}

export function computeValuation(
  property: PropertyInput,
  data: ZoneComparisonData,
): ValuationResult {
  // Guard: area must be positive to avoid Infinity
  const safeArea = property.area_m2 > 0 ? property.area_m2 : 1
  const price_per_m2 = property.price_mxn / safeArea

  // ── Price premium vs zone average ──
  const zone_avg = data.zone.avg_price_per_m2
  const premium_pct =
    zone_avg > 0 ? ((price_per_m2 / zone_avg) - 1) * 100 : 0

  // ── Percentile in zone ──
  const allPricesPerM2 = data.zone_listings.map((l) => l.price_per_m2)
  const percentile = computePercentile(price_per_m2, allPricesPerM2)

  // ── Comparison vs same property type ──
  const typeMedian = median(data.type_listings.map((l) => l.price_per_m2))
  const price_vs_type_avg_pct =
    typeMedian > 0 ? ((price_per_m2 / typeMedian) - 1) * 100 : 0

  // ── Area comparison ──
  const avgArea = data.type_listings.length > 0
    ? median(data.type_listings.map((l) => l.area_m2))
    : 0
  const area_vs_zone_avg_pct =
    avgArea > 0 ? ((property.area_m2 / avgArea) - 1) * 100 : 0

  // ── Score calculation ──
  // Factor 1 (60%): Price discount vs zone median — inverted so cheaper = higher score
  // premium_pct = -20 → property is 20% cheaper → good
  // premium_pct = +20 → property is 20% more expensive → bad
  const priceScore = clamp(50 - premium_pct * 1.5, 0, 100)

  // Factor 2 (15%): vs same type — inverted
  const typeScore = clamp(50 - price_vs_type_avg_pct * 1.5, 0, 100)

  // Factor 3 (10%): Market trend — positive trend means current price may appreciate
  const trend = data.zone.price_trend_pct
  const trendScore = clamp(50 + trend * 5, 0, 100)

  // Factor 4 (10%): Liquidity — higher liquidity = easier to sell = less risk
  const liquidityScore = data.risk?.liquidity_score ?? 50

  // Factor 5 (5%): Volatility — lower volatility = more stable = better
  const volatility = data.risk?.volatility ?? 10
  const volatilityScore = clamp(100 - volatility * 5, 0, 100)

  const score = Math.round(
    priceScore * 0.60 +
    typeScore * 0.15 +
    trendScore * 0.10 +
    liquidityScore * 0.10 +
    volatilityScore * 0.05,
  )

  const finalScore = clamp(score, 0, 100)
  const verdict = verdictFromScore(finalScore)

  // ── Verdict reasons ──
  const reasons: string[] = []

  if (premium_pct < -15) {
    reasons.push(`Precio/m² ${Math.abs(premium_pct).toFixed(0)}% por debajo del promedio de la zona`)
  } else if (premium_pct > 15) {
    reasons.push(`Precio/m² ${premium_pct.toFixed(0)}% por encima del promedio de la zona`)
  } else {
    reasons.push(`Precio/m² dentro del rango promedio (${premium_pct > 0 ? "+" : ""}${premium_pct.toFixed(0)}%)`)
  }

  if (percentile <= 25) {
    reasons.push(`En el cuartil más económico de la zona (percentil ${percentile})`)
  } else if (percentile >= 75) {
    reasons.push(`En el cuartil más caro de la zona (percentil ${percentile})`)
  } else {
    reasons.push(`Percentil ${percentile} en la distribución de precios de la zona`)
  }

  if (trend > 3) {
    reasons.push(`Zona con tendencia alcista (+${trend.toFixed(1)}%) — el precio actual podría apreciarse`)
  } else if (trend < -3) {
    reasons.push(`Zona con tendencia bajista (${trend.toFixed(1)}%) — considerar negociar`)
  }

  if (liquidityScore > 70) {
    reasons.push("Alta liquidez en la zona — facilidad de reventa")
  } else if (liquidityScore < 30) {
    reasons.push("Baja liquidez — reventa podría ser más lenta")
  }

  if (data.zone_listings.length < 5) {
    reasons.push("Pocos datos comparativos en esta zona — resultado orientativo")
  }

  // ── Comparables (top 10 closest in price/m²) ──
  const comparables = [...data.type_listings]
    .sort((a, b) => Math.abs(a.price_per_m2 - price_per_m2) - Math.abs(b.price_per_m2 - price_per_m2))
    .slice(0, 10)
    .map((l) => ({
      price: l.price,
      area_m2: l.area_m2,
      type: property.property_type,
      price_per_m2: l.price_per_m2,
    }))

  // ── Build result ──
  return {
    zone_name: data.zone.zone_name,
    zone_slug: data.zone.zone_slug,
    zone_avg_price_per_m2: zone_avg,
    zone_avg_ticket: data.zone.avg_ticket,
    zone_total_listings: data.zone.total_listings,

    price_per_m2,
    price_premium_pct: Math.round(premium_pct * 10) / 10,
    price_percentile: percentile,
    price_vs_type_avg_pct: Math.round(price_vs_type_avg_pct * 10) / 10,

    area_vs_zone_avg_pct: Math.round(area_vs_zone_avg_pct * 10) / 10,

    risk_score: data.risk?.risk_score ?? 0,
    risk_label: data.risk?.risk_label ?? "—",
    volatility: data.risk?.volatility ?? 0,
    liquidity_score: data.risk?.liquidity_score ?? 0,
    cap_rate: data.risk?.cap_rate ?? null,

    nse_score: data.demographics?.nse_score ?? 0,
    nse_label: data.demographics
      ? `${data.demographics.nse_score.toFixed(0)}/100`
      : "—",
    affordability_index: data.insights?.affordability_index ?? 0,

    price_trend_pct: data.zone.price_trend_pct,
    demand_pressure: data.insights?.demand_pressure ?? 0,
    appreciation_potential: data.insights?.appreciation_potential ?? 0,

    zone_price_distribution: buildPriceDistribution(
      data.zone_listings,
      price_per_m2,
      property.listing_type,
    ),
    comparable_listings: comparables,

    score: finalScore,
    verdict,
    verdict_reasons: reasons,
  }
}
