/**
 * Zone insights (affordability, demand, appreciation) sanity tests.
 *
 * Catches bugs like: affordability=100 for $8M commercial properties,
 * wrong scores when comparing across categories.
 */

import { describe, it, expect } from "vitest"
import { computeZoneInsights } from "@/lib/data/zone-insights"
import type { ZoneDemographics } from "@/lib/data/demographics"
import type { ZoneMetrics, ZoneRiskMetrics } from "@/types/database"

// ─── Test Helpers ──────────────────────────────────────────────────

function makeDemographics(overrides: Partial<ZoneDemographics> = {}): ZoneDemographics {
  return {
    zone_slug: "test-zone",
    population: 10000,
    households: 3500,
    occupied_dwellings: 3500,
    avg_occupants: 2.8,
    pct_internet: 70,
    pct_car: 55,
    pct_social_security: 60,
    economically_active: 5000,
    median_age: 35,
    ageb_count: 5,
    avg_education_years: 10,
    pop_no_schooling: 100,
    unemployed: 200,
    pct_computer: 40,
    pct_phone: 80,
    pct_washer: 70,
    pct_refrigerator: 90,
    pct_female: 51,
    pop_0_14: 2000,
    pop_15_64: 7000,
    pop_65_plus: 1000,
    nse_score: 65,
    nse_label: "Medio-Alto",
    dependency_ratio: 43,
    unemployment_rate: 4,
    economic_participation: 59,
    pop_density: 5000,
    ...overrides,
  }
}

function makeMetrics(overrides: Partial<ZoneMetrics> = {}): ZoneMetrics {
  return {
    zone_id: "test-id",
    zone_name: "Test Zone",
    zone_slug: "test-zone",
    avg_price_per_m2: 30_000,
    price_trend_pct: 1.5,
    avg_ticket: 4_000_000,
    total_listings: 50,
    listings_by_type: { casa: 30, departamento: 20, terreno: 0, local: 0, oficina: 0 },
    avg_ticket_by_type: { casa: 4_500_000, departamento: 3_000_000, terreno: 0, local: 0, oficina: 0 },
    ...overrides,
  }
}

function makeRisk(overrides: Partial<ZoneRiskMetrics> = {}): ZoneRiskMetrics {
  return {
    zone_slug: "test-zone",
    zone_name: "Test Zone",
    risk_score: 35,
    volatility: 5,
    cap_rate: 6,
    vacancy_rate: 8,
    liquidity_score: 70,
    market_maturity: "consolidado",
    avg_rent_per_m2: 150,
    risk_label: "Bajo",
    smoothed_trend_pct: 0,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════
// Affordability Index
// ═══════════════════════════════════════════════════════════════════

describe("Affordability Index", () => {
  it("returns null when demographics are missing", () => {
    const result = computeZoneInsights(null, makeMetrics(), makeRisk(), [makeMetrics()])
    expect(result).toBeNull()
  })

  it("returns null when metrics are missing", () => {
    const result = computeZoneInsights(makeDemographics(), null, makeRisk(), [])
    expect(result).toBeNull()
  })

  it("returns null when ageb_count is 0", () => {
    const result = computeZoneInsights(
      makeDemographics({ ageb_count: 0 }),
      makeMetrics(),
      makeRisk(),
      [makeMetrics()]
    )
    expect(result).toBeNull()
  })

  it("most expensive zone should NOT be 'Muy asequible'", () => {
    // Zone at 2× the median price with modest NSE
    const expensiveZone = makeMetrics({ avg_price_per_m2: 60_000 })
    const allZones = [
      makeMetrics({ avg_price_per_m2: 20_000 }),
      makeMetrics({ avg_price_per_m2: 30_000 }),
      expensiveZone,
    ]
    const demo = makeDemographics({ nse_score: 55 })
    const result = computeZoneInsights(demo, expensiveZone, makeRisk(), allZones)

    expect(result).not.toBeNull()
    expect(result!.affordability_index).toBeLessThan(75) // should NOT be "Muy asequible"
    expect(result!.affordability_label).not.toBe("Muy asequible")
  })

  it("cheap zone with high NSE is affordable", () => {
    const cheapZone = makeMetrics({ avg_price_per_m2: 10_000 })
    const allZones = [
      cheapZone,
      makeMetrics({ avg_price_per_m2: 30_000 }),
      makeMetrics({ avg_price_per_m2: 50_000 }),
    ]
    const demo = makeDemographics({ nse_score: 80 })
    const result = computeZoneInsights(demo, cheapZone, makeRisk(), allZones)

    expect(result).not.toBeNull()
    expect(result!.affordability_index).toBeGreaterThanOrEqual(50)
  })

  it("expensive zone with low NSE is NOT affordable", () => {
    const expensiveZone = makeMetrics({ avg_price_per_m2: 50_000 })
    const allZones = [
      makeMetrics({ avg_price_per_m2: 15_000 }),
      makeMetrics({ avg_price_per_m2: 25_000 }),
      expensiveZone,
    ]
    const demo = makeDemographics({ nse_score: 30 })
    const result = computeZoneInsights(demo, expensiveZone, makeRisk(), allZones)

    expect(result).not.toBeNull()
    expect(result!.affordability_index).toBeLessThan(50)
  })

  it("affordability is always 0-100", () => {
    // Extreme values should still clamp
    const zone = makeMetrics({ avg_price_per_m2: 1_000 })
    const allZones = [zone, makeMetrics({ avg_price_per_m2: 100_000 })]
    const demo = makeDemographics({ nse_score: 95 })
    const result = computeZoneInsights(demo, zone, makeRisk(), allZones)

    expect(result).not.toBeNull()
    expect(result!.affordability_index).toBeGreaterThanOrEqual(0)
    expect(result!.affordability_index).toBeLessThanOrEqual(100)
  })

  it("nse_score=0 gives affordability=0", () => {
    const zone = makeMetrics({ avg_price_per_m2: 20_000 })
    const demo = makeDemographics({ nse_score: 0 })
    const result = computeZoneInsights(demo, zone, makeRisk(), [zone])

    expect(result).not.toBeNull()
    expect(result!.affordability_index).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Demand Pressure
// ═══════════════════════════════════════════════════════════════════

describe("Demand Pressure", () => {
  it("high households / few listings = high demand", () => {
    const zone = makeMetrics({ total_listings: 5 })
    const demo = makeDemographics({ households: 5000, economic_participation: 65, pct_internet: 80 })
    const result = computeZoneInsights(demo, zone, makeRisk(), [zone])

    expect(result).not.toBeNull()
    expect(result!.demand_pressure).toBeGreaterThanOrEqual(50)
  })

  it("few households / many listings = lower demand", () => {
    const zone = makeMetrics({ total_listings: 500 })
    const demo = makeDemographics({ households: 100, economic_participation: 40, pct_internet: 30 })
    const result = computeZoneInsights(demo, zone, makeRisk(), [zone])

    expect(result).not.toBeNull()
    expect(result!.demand_pressure).toBeLessThan(50)
  })

  it("demand is always 0-100", () => {
    const zone = makeMetrics({ total_listings: 1 })
    const demo = makeDemographics({ households: 50000 })
    const result = computeZoneInsights(demo, zone, makeRisk(), [zone])

    expect(result).not.toBeNull()
    expect(result!.demand_pressure).toBeGreaterThanOrEqual(0)
    expect(result!.demand_pressure).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Appreciation Potential
// ═══════════════════════════════════════════════════════════════════

describe("Appreciation Potential", () => {
  it("strong fundamentals + low volatility = high potential", () => {
    const demo = makeDemographics({ nse_score: 85, pct_internet: 90, economic_participation: 70, pct_car: 75 })
    const risk = makeRisk({ volatility: 2 })
    const zone = makeMetrics()
    const result = computeZoneInsights(demo, zone, risk, [zone])

    expect(result).not.toBeNull()
    expect(result!.appreciation_potential).toBeGreaterThanOrEqual(50)
  })

  it("weak fundamentals + high volatility = low potential", () => {
    const demo = makeDemographics({ nse_score: 20, pct_internet: 20, economic_participation: 30, pct_car: 10 })
    const risk = makeRisk({ volatility: 15 })
    const zone = makeMetrics()
    const result = computeZoneInsights(demo, zone, risk, [zone])

    expect(result).not.toBeNull()
    expect(result!.appreciation_potential).toBeLessThan(30)
  })

  it("appreciation is always 0-100", () => {
    const demo = makeDemographics({ nse_score: 100, pct_internet: 100, economic_participation: 100, pct_car: 100 })
    const result = computeZoneInsights(demo, makeMetrics(), makeRisk({ volatility: 0 }), [makeMetrics()])

    expect(result).not.toBeNull()
    expect(result!.appreciation_potential).toBeGreaterThanOrEqual(0)
    expect(result!.appreciation_potential).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Label correctness
// ═══════════════════════════════════════════════════════════════════

describe("Label assignments", () => {
  it("scores map to correct labels", () => {
    // We test via the function with controlled inputs
    const zone = makeMetrics({ avg_price_per_m2: 30_000 })
    const allZones = [zone]
    const demo = makeDemographics({ nse_score: 65 })
    const result = computeZoneInsights(demo, zone, makeRisk(), allZones)

    expect(result).not.toBeNull()
    // Each label should be one of the valid options
    const validAffordability = ["Muy asequible", "Asequible", "Costosa para el NSE", "Muy costosa para el NSE"]
    const validDemand = ["Demanda muy alta", "Demanda alta", "Demanda moderada", "Demanda baja"]
    const validAppreciation = ["Alto potencial", "Potencial moderado", "Potencial limitado", "Bajo potencial"]

    expect(validAffordability).toContain(result!.affordability_label)
    expect(validDemand).toContain(result!.demand_label)
    expect(validAppreciation).toContain(result!.appreciation_label)
  })
})
