import { applyMockFilters, type ListingFilters } from "@/lib/data/listings"
import type { Listing } from "@/types/database"

export interface ComparisonListing extends Listing {
  zone_slug: string
  zone_name: string
}

const MOCK_ID_TO_SLUG: Record<string, string> = {
  "1": "zona-rio", "2": "playas-de-tijuana", "3": "otay", "4": "hipodromo-chapultepec",
  "5": "hipodromo-chapultepec", "6": "centro", "7": "cerro-colorado", "8": "la-mesa",
}

const MOCK_SLUG_TO_NAME: Record<string, string> = {
  "zona-rio": "Zona Río", "playas-de-tijuana": "Playas de Tijuana",
  otay: "Otay", "hipodromo-chapultepec": "Hipódromo-Chapultepec",
  centro: "Centro", "cerro-colorado": "Cerro Colorado",
  "la-mesa": "La Mesa",
}

/** Get individual listings for selected zones (server-side) */
export function getComparisonListings(
  slugs: string[],
  filters?: ListingFilters
): ComparisonListing[] {
  if (!slugs.length) return []

  const { listings } = applyMockFilters({ ...filters, zonas: slugs })

  return listings.map((l) => ({
    ...l,
    zone_slug: MOCK_ID_TO_SLUG[l.zone_id] ?? l.zone_id,
    zone_name: MOCK_SLUG_TO_NAME[MOCK_ID_TO_SLUG[l.zone_id]] ?? l.zone_id,
  }))
}
