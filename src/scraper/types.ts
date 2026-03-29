import type { PropertyType, ListingType, SourcePortal } from "@/types/database";

export interface RawListing {
  source_portal: SourcePortal;
  external_id: string;
  external_url: string;
  title: string | null;
  description: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  price_mxn: number | null;
  price_usd: number | null;
  area_m2: number | null;
  area_construccion_m2: number | null;
  area_terreno_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  images: string[];
  raw_data: Record<string, unknown>;

  // Rental-specific attributes (Phase 4)
  is_furnished?: boolean | null;
  maintenance_fee?: number | null;
  deposit_months?: number | null;
  lease_term_months?: number | null;
  pets_allowed?: boolean | null;
  is_short_term?: boolean | null;
  utilities_included?: boolean | null;
  amenities?: string[];
}

export interface ScraperConfig {
  portal: SourcePortal;
  pages?: number;
  listing_type?: ListingType;
  property_type?: PropertyType;
}

export interface ScraperAdapter {
  portal: SourcePortal;
  scrape(config: ScraperConfig): Promise<RawListing[]>;
}

export interface ScraperRunResult {
  runId: string;
  portal: SourcePortal;
  listingsFound: number;
  listingsNew: number;
  listingsUpdated: number;
  errors: ScraperError[];
  durationMs: number;
}

export interface ScraperError {
  portal: SourcePortal;
  url: string | null;
  error_type: string;
  error_message: string;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}
