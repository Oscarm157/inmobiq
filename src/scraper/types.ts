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
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  images: string[];
  raw_data: Record<string, unknown>;
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
