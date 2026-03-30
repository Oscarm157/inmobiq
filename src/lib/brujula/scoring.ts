/**
 * Brújula — Scoring algorithm v2.
 * Compares a single property against zone-level data and produces a 0-100 score.
 *
 * v2 improvements:
 *   - Separate formulas for venta vs renta
 *   - Incorporates demand_pressure, appreciation_potential, affordability_index
 *   - Calibrated price multiplier per property type
 *   - Statistical confidence adjustment (small sample → score trends to 50)
 *   - Uses smoothed trend (4-week weighted) instead of raw week-over-week
 *
 * Score interpretation:
 *   0-19  → Muy caro
 *  20-39  → Caro
 *  40-59  → Precio justo
 *  60-79  → Barato
 *  80-100 → Muy barato
 */

import type {
  PropertyType,
  ListingType,
  ValuationVerdict,
  ValuationResult,
} from "@/types/database"
import { classifySocioeconomicProfile, getProfileColor } from "@/lib/data/demographics"
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

// ── Price multiplier per property type (calibrated to natural price dispersion) ──
const PRICE_MULTIPLIER: Record<PropertyType, number> = {
  departamento: 2.0,  // Low dispersion → more sensitive
  casa: 1.5,          // Medium dispersion (baseline)
  terreno: 1.0,       // High dispersion → less sensitive
  local: 1.2,         // Medium-high dispersion
  oficina: 1.2,       // Medium-high dispersion
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
  area_construccion_m2?: number | null
  property_type: PropertyType
  listing_type: ListingType
  bedrooms: number | null
  bathrooms: number | null
}

export function computeValuation(
  property: PropertyInput,
  data: ZoneComparisonData,
): ValuationResult {
  // Prefer construccion area for non-terreno properties; fall back to area_m2
  const effectiveArea = (property.property_type !== "terreno" && property.area_construccion_m2)
    ? property.area_construccion_m2
    : property.area_m2
  const safeArea = effectiveArea > 0 ? effectiveArea : 1
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

  // ── Score factors ──
  const mult = PRICE_MULTIPLIER[property.property_type]

  // Price score: blended zone avg + type median comparison (inverted: cheaper = higher)
  const zoneDiscount = clamp(50 - premium_pct * mult, 0, 100)
  const typeDiscount = clamp(50 - price_vs_type_avg_pct * mult, 0, 100)
  const priceScore = zoneDiscount * 0.65 + typeDiscount * 0.35

  // Smoothed trend (4-week weighted avg, or fallback to raw trend)
  const smoothedTrend = data.risk?.smoothed_trend_pct ?? data.zone.price_trend_pct
  const trendScore = clamp(50 + smoothedTrend * 5, 0, 100)

  // Volatility inverse (lower volatility = better)
  const volatility = data.risk?.volatility ?? 10
  const volatilityScore = clamp(100 - volatility * 5, 0, 100)

  // Liquidity (from risk metrics)
  const liquidityScore = data.risk?.liquidity_score ?? 50

  // Market score: blended trend + stability + liquidity
  const marketScore = trendScore * 0.40 + volatilityScore * 0.30 + liquidityScore * 0.30

  let rawScore: number

  if (property.listing_type === "venta") {
    // Context score: percentile + affordability + area comparison
    const percentileScore = clamp(100 - percentile, 0, 100) // lower percentile = cheaper = better
    const affordabilityScore = data.insights?.affordability_index ?? 50
    const areaScore = clamp(50 + area_vs_zone_avg_pct * 0.5, 0, 100) // bigger than avg = slight bonus
    const contextScore = percentileScore * 0.40 + affordabilityScore * 0.30 + areaScore * 0.30

    // Fundamentals score: appreciation potential + NSE + demand
    const appreciationScore = data.insights?.appreciation_potential ?? 50
    const nseScore = data.demographics?.nse_score ?? 50
    const demandScore = data.insights?.demand_pressure ?? 50
    const fundamentalsScore = appreciationScore * 0.50 + nseScore * 0.25 + demandScore * 0.25

    // VENTA formula: price 40% + context 20% + fundamentals 20% + market 20%
    rawScore = Math.round(
      priceScore * 0.40 +
      contextScore * 0.20 +
      fundamentalsScore * 0.20 +
      marketScore * 0.20,
    )
  } else {
    // RENTA formula
    // Yield score: cap rate + rental velocity
    const capRate = data.risk?.cap_rate ?? 6
    const capRateScore = clamp((capRate - 3) * (100 / 9), 0, 100) // 3% → 0, 12% → 100
    const rentalVelocityScore = data.rental_insights
      ? (data.rental_insights.rental_velocity === "alta" ? 85
        : data.rental_insights.rental_velocity === "media" ? 55 : 25)
      : 50
    const yieldScore = capRateScore * 0.60 + rentalVelocityScore * 0.40

    // Demand score: rental demand + general demand pressure + internet (digital nomad appeal)
    const rentalDemand = data.rental_insights?.rental_demand_score ?? 50
    const generalDemand = data.insights?.demand_pressure ?? 50
    const internetScore = data.demographics?.pct_internet ?? 50
    const demandScore = rentalDemand * 0.50 + generalDemand * 0.30 + internetScore * 0.20

    // RENTA formula: price 35% + yield 25% + demand 20% + market 20%
    rawScore = Math.round(
      priceScore * 0.35 +
      yieldScore * 0.25 +
      demandScore * 0.20 +
      marketScore * 0.20,
    )
  }

  // ── Confidence adjustment ──
  // With fewer than 15 comparable listings, pull score toward 50 (uncertain)
  const sampleSize = data.zone_listings.length
  const confidence = Math.min(1, sampleSize / 15)
  const adjustedScore = Math.round(rawScore * confidence + 50 * (1 - confidence))

  const finalScore = clamp(adjustedScore, 0, 100)
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

  if (smoothedTrend > 3) {
    reasons.push(`Zona con tendencia alcista (+${smoothedTrend.toFixed(1)}%) — el precio actual podría apreciarse`)
  } else if (smoothedTrend < -3) {
    reasons.push(`Zona con tendencia bajista (${smoothedTrend.toFixed(1)}%) — considerar negociar`)
  }

  if (liquidityScore > 70) {
    reasons.push("Alta liquidez en la zona — facilidad de reventa")
  } else if (liquidityScore < 30) {
    reasons.push("Baja liquidez — reventa podría ser más lenta")
  }

  // New v2 reasons
  if (data.insights) {
    if (data.insights.demand_pressure >= 70) {
      reasons.push("Alta presión de demanda en la zona — favorable para inversión")
    } else if (data.insights.demand_pressure <= 30) {
      reasons.push("Baja presión de demanda — mercado con poca competencia de compradores")
    }

    if (property.listing_type === "venta" && data.insights.appreciation_potential >= 70) {
      reasons.push("Fundamentales demográficos fuertes — alto potencial de apreciación")
    }
  }

  if (property.listing_type === "renta" && data.rental_insights) {
    if (data.rental_insights.rental_velocity === "alta") {
      reasons.push("Alta velocidad de renta — las propiedades se ocupan rápidamente")
    } else if (data.rental_insights.rental_velocity === "baja") {
      reasons.push("Velocidad de renta baja — podría tardar en encontrar inquilino")
    }
  }

  if (sampleSize < 15) {
    reasons.push(`Pocos datos comparativos (${sampleSize} listings) — resultado orientativo`)
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

  // ── Area by type ──
  const TYPE_LABELS: Record<string, string> = {
    casa: "Casa", departamento: "Depto", terreno: "Terreno", local: "Local", oficina: "Oficina",
  }
  const typeGroups = new Map<string, number[]>()
  for (const l of data.zone_listings) {
    if (l.area_m2 > 0) {
      const arr = typeGroups.get(l.property_type) ?? []
      arr.push(l.area_m2)
      typeGroups.set(l.property_type, arr)
    }
  }
  const area_by_type = Array.from(typeGroups.entries())
    .map(([type, areas]) => {
      const med = median(areas)
      return { type: TYPE_LABELS[type] ?? type, typeKey: type, area: Math.round(med), label: `${Math.round(med).toLocaleString("es-MX")} m²` }
    })
    .sort((a, b) => b.area - a.area)

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

    zone_avg_area: Math.round(avgArea),
    area_vs_zone_avg_pct: Math.round(area_vs_zone_avg_pct * 10) / 10,
    ticket_premium_pct: data.zone.avg_ticket > 0
      ? Math.round(((property.price_mxn / data.zone.avg_ticket) - 1) * 1000) / 10
      : 0,

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

    demographics: data.demographics
      ? (() => {
          const d = data.demographics
          const profile = classifySocioeconomicProfile(d)
          const peaRatio = d.population > 0
            ? Math.round((d.economically_active / d.population) * 100)
            : 0
          return {
            population: d.population,
            households: d.households,
            pea_ratio: peaRatio,
            pct_internet: d.pct_internet,
            pct_car: d.pct_car,
            pct_social_security: d.pct_social_security,
            nse_profile: profile,
            nse_profile_color: getProfileColor(profile),
          }
        })()
      : null,

    area_by_type,
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
