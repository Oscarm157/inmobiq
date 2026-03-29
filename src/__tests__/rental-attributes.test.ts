/**
 * Rental attribute extraction tests.
 * Validates three-layer extraction: structured raw_data > description regex > title.
 */

import { describe, it, expect } from "vitest"
import {
  extractRentalAttributes,
  extractRentalAttributesBatch,
  getZoneCurrencyMix,
} from "@/lib/data/rental-attributes"
import type { Listing } from "@/types/database"

// ─── Test Helpers ──────────────────────────────────────────────────

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "test-1",
    zone_id: "zone-1",
    title: "Departamento en renta",
    property_type: "departamento",
    listing_type: "renta",
    price: 15000,
    area_m2: 80,
    price_per_m2: 187.5,
    bedrooms: 2,
    bathrooms: 1,
    source: "inmuebles24",
    source_url: "https://example.com",
    scraped_at: "2026-03-01",
    created_at: "2026-03-01",
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════
// Layer 1: Inmuebles24 structured raw_data
// ═══════════════════════════════════════════════════════════════════

describe("Inmuebles24 raw_data extraction", () => {
  it("extracts furnished status from main_features", () => {
    const listing = makeListing({
      source: "inmuebles24",
      raw_data: {
        main_features: {
          "1": { label: "Amueblado", value: "Sí" },
          "2": { label: "Recámaras", value: "2" },
        },
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(true)
  })

  it("extracts maintenance fee from main_features", () => {
    const listing = makeListing({
      source: "inmuebles24",
      raw_data: {
        main_features: {
          "1": { label: "Mantenimiento", value: "$2,500" },
        },
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.maintenance_fee).toBe(2500)
  })

  it("extracts amenities from main_features labels", () => {
    const listing = makeListing({
      source: "inmuebles24",
      raw_data: {
        main_features: {
          "1": { label: "Alberca", value: "Sí" },
          "2": { label: "Gimnasio", value: "Sí" },
          "3": { label: "Seguridad 24 hrs", value: "Sí" },
        },
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.amenities).toContain("Alberca")
    expect(attrs.amenities).toContain("Gimnasio")
    expect(attrs.amenities).toContain("Seguridad 24/7")
  })

  it("falls back to description_normalized from raw_data", () => {
    const listing = makeListing({
      source: "inmuebles24",
      raw_data: {
        main_features: {},
        description_normalized: "Departamento amueblado con alberca. Mascotas no permitidas. Depósito 2 meses.",
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(true)
    expect(attrs.pets_allowed).toBe(false)
    expect(attrs.deposit_months).toBe(2)
    expect(attrs.amenities).toContain("Alberca")
  })
})

// ═══════════════════════════════════════════════════════════════════
// Layer 1: MercadoLibre structured raw_data
// ═══════════════════════════════════════════════════════════════════

describe("MercadoLibre raw_data extraction", () => {
  it("extracts furnished and pets from attributes", () => {
    const listing = makeListing({
      source: "mercadolibre",
      raw_data: {
        source: "preloaded_state",
        raw: {
          attributes: [
            { id: "FURNISHED", value_name: "Sí" },
            { id: "PETS_ALLOWED", value_name: "Yes" },
          ],
        },
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(true)
    expect(attrs.pets_allowed).toBe(true)
  })

  it("extracts maintenance from attributes", () => {
    const listing = makeListing({
      source: "mercadolibre",
      raw_data: {
        source: "preloaded_state",
        raw: {
          attributes: [
            { id: "MAINTENANCE_FEE", value_name: "3000" },
          ],
        },
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.maintenance_fee).toBe(3000)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Layer 2: Description text parsing
// ═══════════════════════════════════════════════════════════════════

describe("Description text extraction", () => {
  it("detects furnished from description", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Hermoso departamento completamente amueblado y equipado" },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(true)
  })

  it("detects unfurnished from description", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Se renta departamento sin amueblar en Zona Río" },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(false)
  })

  it("extracts maintenance amount from description", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Cuota de mantenimiento: $1,800 mensuales. Incluye vigilancia." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.maintenance_fee).toBe(1800)
  })

  it("detects maintenance included", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Renta con mantenimiento incluido en el precio." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.maintenance_fee).toBe(0)
  })

  it("extracts deposit months", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Se solicita depósito de 2 meses y referencias personales." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.deposit_months).toBe(2)
  })

  it("extracts single month deposit", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Depósito de un mes de renta." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.deposit_months).toBe(1)
  })

  it("extracts lease term", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Contrato de 12 meses mínimo. No mascotas." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.lease_term_months).toBe(12)
    expect(attrs.pets_allowed).toBe(false)
  })

  it("detects pets allowed", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Pet friendly! Se aceptan mascotas pequeñas." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.pets_allowed).toBe(true)
  })

  it("detects utilities included", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Renta $8,000 servicios incluidos (luz, agua, internet)." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.utilities_included).toBe(true)
  })

  it("detects short-term rental", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Renta temporal amueblado. Disponible por noche o semana. Ideal Airbnb." },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_short_term).toBe(true)
    expect(attrs.is_furnished).toBe(true)
  })

  it("detects USD currency from description", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Renta $1,200 USD / dólares mensuales" },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.currency_listed).toBe("USD")
  })

  it("extracts multiple amenities from description", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: {
        description: "Condominio con alberca, gimnasio, elevador, seguridad 24 hrs, roof garden y áreas comunes.",
      },
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.amenities).toContain("Alberca")
    expect(attrs.amenities).toContain("Gimnasio")
    expect(attrs.amenities).toContain("Elevador")
    expect(attrs.amenities).toContain("Seguridad 24/7")
    expect(attrs.amenities).toContain("Roof Garden")
    expect(attrs.amenities).toContain("Áreas Comunes")
  })
})

// ═══════════════════════════════════════════════════════════════════
// Layer 3: Title parsing
// ═══════════════════════════════════════════════════════════════════

describe("Title extraction", () => {
  it("detects furnished from title", () => {
    const listing = makeListing({
      title: "DEPTO AMUEBLADO EN ZONA RIO",
      source: "vivanuncios",
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBe(true)
  })

  it("detects pet friendly from title", () => {
    const listing = makeListing({
      title: "Casa en renta PET FRIENDLY con alberca",
      source: "vivanuncios",
    })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.pets_allowed).toBe(true)
    expect(attrs.amenities).toContain("Alberca")
  })
})

// ═══════════════════════════════════════════════════════════════════
// Priority: structured data wins over text parsing
// ═══════════════════════════════════════════════════════════════════

describe("Layer priority", () => {
  it("structured raw_data overrides description", () => {
    const listing = makeListing({
      source: "inmuebles24",
      raw_data: {
        main_features: {
          "1": { label: "Amueblado", value: "Sí" },
        },
        description_normalized: "Departamento sin amueblar",
      },
    })
    const attrs = extractRentalAttributes(listing)
    // Structured says furnished=true, description says false. Structured wins.
    expect(attrs.is_furnished).toBe(true)
  })

  it("uses original_currency from listing interface", () => {
    const listing = makeListing({ original_currency: "USD" })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.currency_listed).toBe("USD")
  })
})

// ═══════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("returns all nulls for listing with no data", () => {
    const listing = makeListing({ raw_data: undefined, title: "Departamento en renta" })
    const attrs = extractRentalAttributes(listing)
    expect(attrs.is_furnished).toBeNull()
    expect(attrs.maintenance_fee).toBeNull()
    expect(attrs.deposit_months).toBeNull()
    expect(attrs.pets_allowed).toBeNull()
    expect(attrs.amenities).toEqual([])
  })

  it("rejects unreasonable maintenance fees", () => {
    const listing = makeListing({
      source: "lamudi",
      raw_data: { description: "Mantenimiento $50,000 mensuales" },
    })
    const attrs = extractRentalAttributes(listing)
    // $50K is > $20K limit, should not be extracted
    expect(attrs.maintenance_fee).toBeNull()
  })

  it("deduplicates amenities across layers", () => {
    const listing = makeListing({
      title: "Depto con alberca y gym",
      source: "inmuebles24",
      raw_data: {
        main_features: { "1": { label: "Alberca", value: "Sí" } },
        description_normalized: "Incluye alberca y gimnasio",
      },
    })
    const attrs = extractRentalAttributes(listing)
    const albercaCount = attrs.amenities.filter((a) => a === "Alberca").length
    expect(albercaCount).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Batch extraction + stats
// ═══════════════════════════════════════════════════════════════════

describe("extractRentalAttributesBatch", () => {
  it("computes furnished premium correctly", () => {
    const listings = [
      makeListing({ id: "1", price_per_m2: 250, source: "lamudi", raw_data: { description: "Amueblado completo" } }),
      makeListing({ id: "2", price_per_m2: 200, source: "lamudi", raw_data: { description: "Sin amueblar" } }),
      makeListing({ id: "3", price_per_m2: 270, source: "lamudi", raw_data: { description: "Depto amueblado" } }),
      makeListing({ id: "4", price_per_m2: 180, source: "lamudi", raw_data: { description: "Sin muebles" } }),
    ]
    const { stats } = extractRentalAttributesBatch(listings)
    expect(stats.furnishedCount).toBe(2)
    expect(stats.unfurnishedCount).toBe(2)
    expect(stats.furnishedPremiumPct).toBeGreaterThan(0)
  })

  it("counts amenities across listings", () => {
    const listings = [
      makeListing({ id: "1", source: "lamudi", raw_data: { description: "Con alberca y gym" } }),
      makeListing({ id: "2", source: "lamudi", raw_data: { description: "Con alberca y seguridad" } }),
    ]
    const { stats } = extractRentalAttributesBatch(listings)
    const alberca = stats.topAmenities.find((a) => a.name === "Alberca")
    expect(alberca).toBeDefined()
    expect(alberca!.count).toBe(2)
    expect(alberca!.pct).toBe(100)
  })
})

// ═══════════════════════════════════════════════════════════════════
// Zone currency mix
// ═══════════════════════════════════════════════════════════════════

describe("getZoneCurrencyMix", () => {
  it("returns 100% MXN when no USD listings", () => {
    const listings = [
      makeListing({ original_currency: "MXN" }),
      makeListing({ id: "2", original_currency: "MXN" }),
    ]
    const mix = getZoneCurrencyMix(listings)
    expect(mix.pctMxn).toBe(100)
    expect(mix.pctUsd).toBe(0)
    expect(mix.avgUsdPremiumPct).toBeNull()
  })

  it("computes USD premium correctly", () => {
    const listings = [
      makeListing({ id: "1", original_currency: "MXN", price_per_m2: 200 }),
      makeListing({ id: "2", original_currency: "USD", price_per_m2: 300 }),
    ]
    const mix = getZoneCurrencyMix(listings)
    expect(mix.pctMxn).toBe(50)
    expect(mix.pctUsd).toBe(50)
    expect(mix.avgUsdPremiumPct).toBe(50)
  })

  it("defaults to MXN when original_currency is undefined", () => {
    const listings = [makeListing({ original_currency: undefined })]
    const mix = getZoneCurrencyMix(listings)
    expect(mix.pctMxn).toBe(100)
  })

  it("handles empty array", () => {
    const mix = getZoneCurrencyMix([])
    expect(mix.pctMxn).toBe(100)
    expect(mix.pctUsd).toBe(0)
  })
})
