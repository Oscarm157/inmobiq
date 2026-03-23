/**
 * Listing normalization — validate prices, detect misclassified listings,
 * categorize properties, and remove statistical outliers.
 *
 * Business rules for Tijuana real estate market (2025-2026).
 */

import type { PropertyType } from "@/types/database"

/* ------------------------------------------------------------------ */
/*  Property Categories                                                */
/* ------------------------------------------------------------------ */

export type PropertyCategory = "residencial" | "comercial" | "terreno"

const CATEGORY_MAP: Record<PropertyType, PropertyCategory> = {
  casa: "residencial",
  departamento: "residencial",
  terreno: "terreno",
  local: "comercial",
  oficina: "comercial",
}

export function getPropertyCategory(type: PropertyType): PropertyCategory {
  return CATEGORY_MAP[type] ?? "residencial"
}

export const RESIDENTIAL_TYPES: PropertyType[] = ["casa", "departamento"]
export const COMMERCIAL_TYPES: PropertyType[] = ["local", "oficina"]
export const LAND_TYPES: PropertyType[] = ["terreno"]

export function isResidential(type: PropertyType): boolean {
  return CATEGORY_MAP[type] === "residencial"
}

export function isCommercial(type: PropertyType): boolean {
  return CATEGORY_MAP[type] === "comercial"
}

/* ------------------------------------------------------------------ */
/*  Price validation thresholds (MXN)                                  */
/* ------------------------------------------------------------------ */

/**
 * Absolute price bounds per listing type × category.
 *
 * VENTA — total property price:
 *   Residencial: $300K – $50M (no existe casa <$300K en Tijuana 2025)
 *   Comercial:   $200K – $100M
 *   Terreno:     $100K – $80M
 *
 * RENTA — monthly rent:
 *   Residencial: $3K – $150K (casas/deptos, renta mensual)
 *   Comercial:   $3K – $500K (locales/oficinas grandes)
 *   Terreno:     $1K – $200K
 */
const PRICE_BOUNDS: Record<string, Record<PropertyCategory, { min: number; max: number }>> = {
  venta: {
    residencial: { min: 300_000, max: 50_000_000 },
    comercial: { min: 200_000, max: 100_000_000 },
    terreno: { min: 100_000, max: 80_000_000 },
  },
  renta: {
    residencial: { min: 3_000, max: 150_000 },
    comercial: { min: 3_000, max: 500_000 },
    terreno: { min: 1_000, max: 200_000 },
  },
}

/**
 * Price per m² sanity bounds per listing type × category.
 *
 * VENTA — price/m²:
 *   Residencial: $3K – $200K/m²
 *   Comercial:   $5K – $300K/m²
 *   Terreno:     $1K – $100K/m²
 *
 * RENTA — monthly rent/m²:
 *   Residencial: $30 – $2,000/m²
 *   Comercial:   $30 – $5,000/m²
 *   Terreno:     $5 – $1,000/m²
 */
const PRICE_PER_M2_BOUNDS: Record<string, Record<PropertyCategory, { min: number; max: number }>> = {
  venta: {
    residencial: { min: 3_000, max: 200_000 },
    comercial: { min: 5_000, max: 300_000 },
    terreno: { min: 1_000, max: 100_000 },
  },
  renta: {
    residencial: { min: 30, max: 2_000 },
    comercial: { min: 30, max: 5_000 },
    terreno: { min: 5, max: 1_000 },
  },
}

/* ------------------------------------------------------------------ */
/*  Listing validation                                                 */
/* ------------------------------------------------------------------ */

export interface NormalizationResult {
  isValid: boolean
  reason?: "price_too_low" | "price_too_high" | "price_per_m2_out_of_range" | "missing_data"
}

/**
 * Validate a listing has credible pricing for its type.
 * Works for both venta AND renta listings.
 */
export function isValidListing(
  propertyType: PropertyType,
  listingType: string,
  priceMxn: number | null,
  areaM2: number | null,
): NormalizationResult {
  if (!priceMxn || priceMxn <= 0) {
    return { isValid: false, reason: "missing_data" }
  }

  const lt = listingType === "renta" ? "renta" : "venta"
  const category = getPropertyCategory(propertyType)

  // Check absolute price bounds
  const bounds = PRICE_BOUNDS[lt]?.[category]
  if (bounds) {
    if (priceMxn < bounds.min) return { isValid: false, reason: "price_too_low" }
    if (priceMxn > bounds.max) return { isValid: false, reason: "price_too_high" }
  }

  // Check price/m² bounds (only when area is available)
  if (areaM2 && areaM2 > 0) {
    const pricePerM2 = priceMxn / areaM2
    const m2Bounds = PRICE_PER_M2_BOUNDS[lt]?.[category]
    if (m2Bounds) {
      if (pricePerM2 < m2Bounds.min || pricePerM2 > m2Bounds.max) {
        return { isValid: false, reason: "price_per_m2_out_of_range" }
      }
    }
  }

  return { isValid: true }
}


/* ------------------------------------------------------------------ */
/*  Filtering helpers for listings arrays                              */
/* ------------------------------------------------------------------ */

interface ListingLike {
  property_type: PropertyType | string
  listing_type?: string
  price?: number
  price_mxn?: number | null
  area_m2?: number | null
}

/** Get the effective price from a listing object (handles both shapes) */
function getPrice(l: ListingLike): number | null {
  if ("price_mxn" in l && l.price_mxn) return l.price_mxn
  if ("price" in l && l.price) return l.price
  return null
}

/**
 * Filter out listings with invalid pricing (misclassified, data errors).
 * Validates both venta and renta listings.
 */
export function filterNormalizedListings<T extends ListingLike>(listings: T[]): T[] {
  return listings.filter((l) => {
    const result = isValidListing(
      l.property_type as PropertyType,
      l.listing_type ?? "venta",
      getPrice(l),
      l.area_m2 ?? null,
    )
    return result.isValid
  })
}

/**
 * Filter listings by property category.
 */
export function filterByCategory<T extends ListingLike>(
  listings: T[],
  category: PropertyCategory,
): T[] {
  return listings.filter(
    (l) => getPropertyCategory(l.property_type as PropertyType) === category,
  )
}

/* ------------------------------------------------------------------ */
/*  Statistical outlier removal (IQR)                                  */
/* ------------------------------------------------------------------ */

/**
 * Remove statistical outliers using the Interquartile Range method.
 * Use for chart data only — KPIs should reflect the full filtered market.
 *
 * @param items     Array of items to filter
 * @param getValue  Function to extract the numeric value to evaluate
 * @param multiplier  IQR multiplier (default 2.0 — generous for skewed real estate data)
 */
export function removeOutliers<T>(
  items: T[],
  getValue: (item: T) => number,
  multiplier = 2.0,
): T[] {
  if (items.length < 4) return items
  const values = items.map(getValue).sort((a, b) => a - b)
  const q1 = values[Math.floor(values.length * 0.25)]
  const q3 = values[Math.floor(values.length * 0.75)]
  const iqr = q3 - q1
  if (iqr === 0) return items // all values equal, nothing to remove
  const lower = q1 - multiplier * iqr
  const upper = q3 + multiplier * iqr
  return items.filter((item) => {
    const v = getValue(item)
    return v >= lower && v <= upper
  })
}
