/**
 * Listing normalization — detect misclassified rentals and categorize properties.
 *
 * Problem: some listings marked as "venta" actually have rental-level prices
 * (e.g. $200/m² instead of $30,000/m²), skewing all zone metrics.
 * This module provides utilities to detect and filter these outliers.
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
/*  Sale price/m² sanity thresholds (MXN)                              */
/* ------------------------------------------------------------------ */

/**
 * Minimum credible sale price per m² by category.
 * Anything below these thresholds for a "venta" listing is almost certainly
 * a misclassified rental (monthly rent posted as sale price).
 *
 * Rationale (Tijuana market, 2025-2026):
 * - Cheapest residential sales: ~$5,000 MXN/m² in peripheral zones
 * - Cheapest commercial sales:  ~$8,000 MXN/m²
 * - Cheapest land:              ~$1,500 MXN/m²
 * - Typical monthly rents:      $100-400 MXN/m² → these show up as outliers
 */
const MIN_SALE_PRICE_PER_M2: Record<PropertyCategory, number> = {
  residencial: 3_000,  // $3,000/m² — very conservative lower bound
  comercial: 5_000,    // $5,000/m²
  terreno: 1_000,      // $1,000/m²
}

/**
 * Maximum credible sale price per m² by category.
 * Anything above is likely a data entry error.
 */
const MAX_SALE_PRICE_PER_M2: Record<PropertyCategory, number> = {
  residencial: 200_000, // $200k/m² — ultra-luxury ceiling
  comercial: 300_000,   // $300k/m²
  terreno: 100_000,     // $100k/m²
}

/* ------------------------------------------------------------------ */
/*  Outlier detection                                                  */
/* ------------------------------------------------------------------ */

export interface NormalizationResult {
  isValid: boolean
  reason?: "suspected_rental" | "price_too_high" | "missing_data"
}

/**
 * Check if a listing marked as "venta" has a credible sale price.
 * Returns false for likely misclassified rentals or data errors.
 */
export function isValidSaleListing(
  propertyType: PropertyType,
  listingType: string,
  priceMxn: number | null,
  areaM2: number | null,
): NormalizationResult {
  // Only validate "venta" listings — renta prices are naturally low
  if (listingType !== "venta") return { isValid: true }

  // Can't validate without both price and area
  if (!priceMxn || priceMxn <= 0 || !areaM2 || areaM2 <= 0) {
    return { isValid: false, reason: "missing_data" }
  }

  const pricePerM2 = priceMxn / areaM2
  const category = getPropertyCategory(propertyType)
  const minPrice = MIN_SALE_PRICE_PER_M2[category]
  const maxPrice = MAX_SALE_PRICE_PER_M2[category]

  if (pricePerM2 < minPrice) {
    return { isValid: false, reason: "suspected_rental" }
  }

  if (pricePerM2 > maxPrice) {
    return { isValid: false, reason: "price_too_high" }
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
 * Filter out listings that are likely misclassified (rentals posted as sales).
 * Works with both Listing interface (price) and DB rows (price_mxn).
 */
export function filterNormalizedListings<T extends ListingLike>(listings: T[]): T[] {
  return listings.filter((l) => {
    const result = isValidSaleListing(
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
