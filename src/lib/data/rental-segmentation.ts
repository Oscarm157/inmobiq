/**
 * Rental market segmentation — groups rental listings into meaningful
 * market segments for analysis and display.
 *
 * Segments:
 * 1. Long-term unfurnished (standard residential)
 * 2. Long-term furnished (digital nomads, cross-border workers)
 * 3. Short-term / vacation (Airbnb-style, very high price/m²)
 * 4. Commercial (already handled by property_type but included for completeness)
 */

import type { Listing, PropertyType } from "@/types/database"
import { extractRentalAttributes, type RentalAttributes } from "./rental-attributes"
import { isResidential, isCommercial } from "./normalize"

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type RentalSegment = "largo_plazo_sin_amuebles" | "largo_plazo_amueblado" | "corto_plazo" | "comercial"

export interface SegmentData {
  segment: RentalSegment
  label: string
  description: string
  count: number
  avgRent: number
  avgRentPerM2: number
  avgArea: number
  /** Yield if sale data available */
  yieldPct: number | null
}

export interface RentalSegmentationResult {
  segments: SegmentData[]
  dominantSegment: RentalSegment
  /** Price/m² ratio: short-term / long-term (if both available) */
  shortTermPremiumMultiple: number | null
}

/* ------------------------------------------------------------------ */
/*  Segment labels                                                     */
/* ------------------------------------------------------------------ */

const SEGMENT_META: Record<RentalSegment, { label: string; description: string }> = {
  largo_plazo_sin_amuebles: {
    label: "Largo Plazo Sin Amuebles",
    description: "Renta residencial estándar, contratos de 12+ meses",
  },
  largo_plazo_amueblado: {
    label: "Largo Plazo Amueblado",
    description: "Nómadas digitales, trabajadores transfronterizos, premium 20-40%",
  },
  corto_plazo: {
    label: "Corto Plazo / Vacacional",
    description: "Tipo Airbnb, rentas por noche/semana, precio/m² 2-3x mayor",
  },
  comercial: {
    label: "Comercial",
    description: "Locales, oficinas y bodegas en renta",
  },
}

/* ------------------------------------------------------------------ */
/*  Classification logic                                               */
/* ------------------------------------------------------------------ */

function classifyListing(listing: Listing, attrs: RentalAttributes): RentalSegment {
  // Commercial property types
  if (isCommercial(listing.property_type as PropertyType)) return "comercial"
  if (listing.property_type === "terreno") return "comercial"

  // Short-term: explicit flag or very high price/m² (> 3x residential median)
  if (attrs.is_short_term) return "corto_plazo"

  // Furnished
  if (attrs.is_furnished === true) return "largo_plazo_amueblado"

  // Default: long-term unfurnished
  return "largo_plazo_sin_amuebles"
}

/* ------------------------------------------------------------------ */
/*  Segmentation computation                                           */
/* ------------------------------------------------------------------ */

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

/**
 * Segment rental listings into market categories.
 * @param rentaListings - Rental listings (listing_type = "renta")
 * @param ventaAvgPrice - Optional: average sale price for yield calculation
 */
export function segmentRentalMarket(
  rentaListings: Listing[],
  ventaAvgPrice?: number,
): RentalSegmentationResult {
  if (rentaListings.length === 0) {
    return { segments: [], dominantSegment: "largo_plazo_sin_amuebles", shortTermPremiumMultiple: null }
  }

  // Classify each listing
  const grouped = new Map<RentalSegment, Listing[]>()
  for (const listing of rentaListings) {
    const attrs = extractRentalAttributes(listing)
    const segment = classifyListing(listing, attrs)
    const arr = grouped.get(segment) ?? []
    arr.push(listing)
    grouped.set(segment, arr)
  }

  // Build segment data
  const segments: SegmentData[] = []
  for (const [segment, listings] of grouped) {
    const prices = listings.filter((l) => l.price > 0).map((l) => l.price)
    const pricesM2 = listings.filter((l) => l.price_per_m2 > 0).map((l) => l.price_per_m2)
    const areas = listings.filter((l) => l.area_m2 > 0).map((l) => l.area_m2)

    const avgRent = avg(prices)
    const avgRentPerM2 = avg(pricesM2)
    const yieldPct = ventaAvgPrice && ventaAvgPrice > 0 && avgRent > 0
      ? (avgRent * 12 / ventaAvgPrice) * 100
      : null

    segments.push({
      segment,
      label: SEGMENT_META[segment].label,
      description: SEGMENT_META[segment].description,
      count: listings.length,
      avgRent: Math.round(avgRent),
      avgRentPerM2: Math.round(avgRentPerM2),
      avgArea: Math.round(avg(areas)),
      yieldPct: yieldPct !== null ? Math.round(yieldPct * 10) / 10 : null,
    })
  }

  // Sort by count descending
  segments.sort((a, b) => b.count - a.count)

  const dominantSegment = segments[0]?.segment ?? "largo_plazo_sin_amuebles"

  // Short-term premium
  const shortTermAvg = segments.find((s) => s.segment === "corto_plazo")?.avgRentPerM2 ?? null
  const longTermAvg = segments.find((s) =>
    s.segment === "largo_plazo_sin_amuebles" || s.segment === "largo_plazo_amueblado"
  )?.avgRentPerM2 ?? null
  const shortTermPremiumMultiple = shortTermAvg && longTermAvg && longTermAvg > 0
    ? Math.round((shortTermAvg / longTermAvg) * 10) / 10
    : null

  return { segments, dominantSegment, shortTermPremiumMultiple }
}
