/**
 * Normalization & price validation tests.
 *
 * Catches bugs like: $1.9M residential rent, invalid price/m² ranges,
 * missing data handling, USD→MXN conversion edge cases.
 */

import { describe, it, expect } from "vitest"

import {
  isValidListing,
  filterNormalizedListings,
  effectivePriceMxn,
  removeOutliers,
  USD_TO_MXN,
} from "@/lib/data/normalize"
import type { PropertyType } from "@/types/database"

// ═══════════════════════════════════════════════════════════════════
// isValidListing — absolute price bounds
// ═══════════════════════════════════════════════════════════════════

describe("isValidListing — venta bounds", () => {
  it("accepts valid residential venta", () => {
    expect(isValidListing("casa", "venta", 3_000_000, 120).isValid).toBe(true)
    expect(isValidListing("departamento", "venta", 500_000, 60).isValid).toBe(true)
  })

  it("rejects residential venta below $300K", () => {
    const r = isValidListing("casa", "venta", 200_000, 80)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_too_low")
  })

  it("rejects residential venta above $50M", () => {
    const r = isValidListing("casa", "venta", 60_000_000, 500)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_too_high")
  })

  it("accepts valid commercial venta", () => {
    expect(isValidListing("local", "venta", 5_000_000, 200).isValid).toBe(true)
    expect(isValidListing("oficina", "venta", 8_000_000, 300).isValid).toBe(true)
  })

  it("accepts valid terreno venta", () => {
    expect(isValidListing("terreno", "venta", 500_000, 200).isValid).toBe(true)
  })
})

describe("isValidListing — renta bounds", () => {
  it("accepts valid residential renta", () => {
    expect(isValidListing("casa", "renta", 15_000, 120).isValid).toBe(true)
    expect(isValidListing("departamento", "renta", 8_000, 60).isValid).toBe(true)
  })

  it("rejects residential renta above $150K", () => {
    const r = isValidListing("casa", "renta", 200_000, 120)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_too_high")
  })

  it("rejects residential renta of $1.9M (the bug)", () => {
    const r = isValidListing("casa", "renta", 1_900_000, 150)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_too_high")
  })

  it("rejects residential renta below $3K", () => {
    const r = isValidListing("departamento", "renta", 2_000, 40)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_too_low")
  })

  it("accepts valid commercial renta", () => {
    expect(isValidListing("local", "renta", 25_000, 100).isValid).toBe(true)
    expect(isValidListing("oficina", "renta", 80_000, 200).isValid).toBe(true)
  })

  it("accepts max commercial renta ($500K)", () => {
    expect(isValidListing("local", "renta", 500_000, 2000).isValid).toBe(true)
  })

  it("rejects commercial renta above $500K", () => {
    const r = isValidListing("local", "renta", 600_000, 200)
    expect(r.isValid).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// isValidListing — price per m² bounds
// ═══════════════════════════════════════════════════════════════════

describe("isValidListing — price/m² validation", () => {
  it("rejects residential venta with price/m² < $3K", () => {
    // $400K / 200m² = $2K/m² → too low
    const r = isValidListing("casa", "venta", 400_000, 200)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_per_m2_out_of_range")
  })

  it("rejects residential venta with price/m² > $200K", () => {
    // $10M / 40m² = $250K/m² → too high
    const r = isValidListing("departamento", "venta", 10_000_000, 40)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("price_per_m2_out_of_range")
  })

  it("accepts residential renta with valid price/m²", () => {
    // $15K / 100m² = $150/m² → valid (range: $30-$2000)
    expect(isValidListing("casa", "renta", 15_000, 100).isValid).toBe(true)
  })

  it("skips price/m² check when area is 0 or null", () => {
    expect(isValidListing("casa", "venta", 3_000_000, 0).isValid).toBe(true)
    expect(isValidListing("casa", "venta", 3_000_000, null).isValid).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════
// isValidListing — edge cases
// ═══════════════════════════════════════════════════════════════════

describe("isValidListing — edge cases", () => {
  it("rejects price = 0", () => {
    const r = isValidListing("casa", "venta", 0, 100)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("missing_data")
  })

  it("rejects price = null", () => {
    const r = isValidListing("casa", "venta", null, 100)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("missing_data")
  })

  it("rejects negative price", () => {
    const r = isValidListing("casa", "venta", -500_000, 100)
    expect(r.isValid).toBe(false)
    expect(r.reason).toBe("missing_data")
  })

  it("treats unknown listing_type as venta", () => {
    // Unknown type defaults to venta bounds
    expect(isValidListing("casa", "unknown_type", 3_000_000, 120).isValid).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════
// isValidListing — exhaustive boundary tests for all 6 combos
// ═══════════════════════════════════════════════════════════════════

describe("isValidListing — boundary values for all combos", () => {
  const combos: Array<{
    type: PropertyType
    listing: string
    min: number
    max: number
    validArea: number
  }> = [
    { type: "casa", listing: "venta", min: 300_000, max: 50_000_000, validArea: 150 },
    { type: "local", listing: "venta", min: 200_000, max: 100_000_000, validArea: 200 },
    { type: "terreno", listing: "venta", min: 100_000, max: 80_000_000, validArea: 500 },
    { type: "departamento", listing: "renta", min: 3_000, max: 150_000, validArea: 80 },
    { type: "oficina", listing: "renta", min: 3_000, max: 500_000, validArea: 300 },
    { type: "terreno", listing: "renta", min: 1_000, max: 200_000, validArea: 500 },
  ]

  for (const c of combos) {
    it(`${c.type}/${c.listing}: min ($${c.min}) is valid`, () => {
      // Use null area to skip price/m² check — we're testing absolute bounds
      expect(isValidListing(c.type, c.listing, c.min, null).isValid).toBe(true)
    })

    it(`${c.type}/${c.listing}: max ($${c.max}) is valid`, () => {
      expect(isValidListing(c.type, c.listing, c.max, null).isValid).toBe(true)
    })

    it(`${c.type}/${c.listing}: below min is invalid`, () => {
      expect(isValidListing(c.type, c.listing, c.min - 1, null).isValid).toBe(false)
    })

    it(`${c.type}/${c.listing}: above max is invalid`, () => {
      expect(isValidListing(c.type, c.listing, c.max + 1, null).isValid).toBe(false)
    })
  }
})

// ═══════════════════════════════════════════════════════════════════
// filterNormalizedListings
// ═══════════════════════════════════════════════════════════════════

describe("filterNormalizedListings", () => {
  it("filters out invalid listings from array", () => {
    const listings = [
      { property_type: "casa" as PropertyType, listing_type: "venta", price: 3_000_000, area_m2: 120 },
      { property_type: "casa" as PropertyType, listing_type: "renta", price: 1_900_000, area_m2: 150 }, // invalid
      { property_type: "departamento" as PropertyType, listing_type: "venta", price: 500_000, area_m2: 60 },
      { property_type: "terreno" as PropertyType, listing_type: "venta", price: 50, area_m2: 100 }, // invalid
    ]
    const result = filterNormalizedListings(listings)
    expect(result).toHaveLength(2)
    expect(result[0].price).toBe(3_000_000)
    expect(result[1].price).toBe(500_000)
  })

  it("handles price_mxn column name", () => {
    const listings = [
      { property_type: "casa" as PropertyType, listing_type: "venta", price_mxn: 3_000_000, area_m2: 120 },
    ]
    const result = filterNormalizedListings(listings)
    expect(result).toHaveLength(1)
  })

  it("returns empty array for all-invalid input", () => {
    const listings = [
      { property_type: "casa" as PropertyType, listing_type: "renta", price: 1_900_000, area_m2: 150 },
    ]
    expect(filterNormalizedListings(listings)).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// effectivePriceMxn
// ═══════════════════════════════════════════════════════════════════

describe("effectivePriceMxn", () => {
  it("prefers MXN price when available", () => {
    expect(effectivePriceMxn(3_000_000, 170_000)).toBe(3_000_000)
  })

  it("converts USD when MXN is null", () => {
    expect(effectivePriceMxn(null, 100_000)).toBe(100_000 * USD_TO_MXN)
  })

  it("converts USD when MXN is 0", () => {
    expect(effectivePriceMxn(0, 100_000)).toBe(100_000 * USD_TO_MXN)
  })

  it("returns null when both are null", () => {
    expect(effectivePriceMxn(null, null)).toBeNull()
  })

  it("returns null when both are 0", () => {
    expect(effectivePriceMxn(0, 0)).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════
// removeOutliers (IQR)
// ═══════════════════════════════════════════════════════════════════

describe("removeOutliers", () => {
  it("removes extreme values", () => {
    const items = [10, 12, 11, 13, 12, 11, 100].map((v) => ({ val: v }))
    const result = removeOutliers(items, (i) => i.val)
    expect(result.every((i) => i.val < 50)).toBe(true)
  })

  it("returns all items when fewer than 4", () => {
    const items = [1, 2, 1000].map((v) => ({ val: v }))
    expect(removeOutliers(items, (i) => i.val)).toHaveLength(3)
  })

  it("returns all items when IQR is 0 (all equal)", () => {
    const items = [5, 5, 5, 5, 5].map((v) => ({ val: v }))
    expect(removeOutliers(items, (i) => i.val)).toHaveLength(5)
  })
})
