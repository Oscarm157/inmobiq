/**
 * Brújula — Fetch all zone-level data needed for property comparison.
 * Reuses existing data layer functions (zones, risk, demographics, insights, listings).
 */

import type { PropertyType, ListingType, ZoneMetrics, ZoneRiskMetrics } from "@/types/database"
import type { ZoneDemographics } from "@/lib/data/demographics"
import type { ZoneInsights } from "@/lib/data/zone-insights"
import { getZoneBySlug, getZoneMetrics, getCityMetrics } from "@/lib/data/zones"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getZoneDemographics } from "@/lib/data/demographics"
import { computeZoneInsights } from "@/lib/data/zone-insights"
import { getListings, type ListingFilters } from "@/lib/data/listings"
import type { PropertyCategory } from "@/lib/data/normalize"

export interface ZoneComparisonData {
  zone: ZoneMetrics
  city_avg_price_per_m2: number
  risk: ZoneRiskMetrics | null
  demographics: ZoneDemographics | null
  insights: ZoneInsights | null
  /** All validated listings in the zone matching the filters — for percentile calculation */
  zone_listings: { price: number; area_m2: number; area_construccion_m2?: number | null; price_per_m2: number; property_type: PropertyType }[]
  /** Same-type listings only */
  type_listings: { price: number; area_m2: number; area_construccion_m2?: number | null; price_per_m2: number }[]
}

/** Map property_type to category for filter purposes */
function typeToCategory(pt: PropertyType): PropertyCategory {
  if (pt === "casa" || pt === "departamento") return "residencial"
  if (pt === "local" || pt === "oficina") return "comercial"
  return "terreno"
}

export async function getZoneDataForValuation(
  zoneSlug: string,
  listingType: ListingType,
  propertyType: PropertyType,
): Promise<ZoneComparisonData | null> {
  const categoria = typeToCategory(propertyType)

  const filters: ListingFilters = {
    zonas: [zoneSlug],
    listing_type: listingType,
    categoria,
  }

  // Fetch all data sources in parallel
  const [zone, allMetrics, { data: riskArr }, cityMetrics, listingsResult] = await Promise.all([
    getZoneBySlug(zoneSlug, { listing_type: listingType, categoria }),
    getZoneMetrics({ listing_type: listingType, categoria }),
    getZoneRiskMetrics(),
    getCityMetrics({ listing_type: listingType, categoria }),
    getListings(filters),
  ])

  if (!zone) return null

  // Sync calls (data from static imports)
  const demographics = getZoneDemographics(zoneSlug)
  const risk = riskArr.find((r) => r.zone_slug === zoneSlug) ?? null
  const insights = computeZoneInsights(demographics, zone, risk, allMetrics)

  // Prepare listings for percentile/distribution
  // Recalculate price_per_m2 using area_construccion_m2 when available (apples-to-apples with subject property)
  const zone_listings = listingsResult.listings
    .filter((l) => l.area_m2 > 0 && l.price > 0)
    .map((l) => {
      const effArea = (l.property_type !== "terreno" && l.area_construccion_m2)
        ? l.area_construccion_m2
        : l.area_m2
      return {
        price: l.price,
        area_m2: l.area_m2,
        area_construccion_m2: l.area_construccion_m2 ?? null,
        price_per_m2: effArea > 0 ? l.price / effArea : l.price_per_m2,
        property_type: l.property_type,
      }
    })

  const type_listings = zone_listings
    .filter((l) => l.property_type === propertyType)
    .map(({ price, area_m2, area_construccion_m2, price_per_m2 }) => ({ price, area_m2, area_construccion_m2, price_per_m2 }))

  return {
    zone,
    city_avg_price_per_m2: cityMetrics.avg_price_per_m2,
    risk,
    demographics,
    insights,
    zone_listings,
    type_listings,
  }
}
