export type PropertyType = "casa" | "departamento" | "terreno" | "local" | "oficina";
export type ListingType = "venta" | "renta";
export type SourcePortal = "inmuebles24" | "lamudi" | "vivanuncios" | "mercadolibre";

export interface Zone {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Listing {
  id: string;
  zone_id: string;
  title: string;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  area_m2: number;
  price_per_m2: number;
  bedrooms: number | null;
  bathrooms: number | null;
  source: SourcePortal;
  source_url: string;
  scraped_at: string;
  created_at: string;
}

export interface ZoneMetrics {
  zone_id: string;
  zone_name: string;
  zone_slug: string;
  avg_price_per_m2: number;
  price_trend_pct: number; // vs previous period
  avg_ticket: number;
  total_listings: number;
  listings_by_type: Record<PropertyType, number>;
  avg_ticket_by_type: Record<PropertyType, number>;
}

export interface CityMetrics {
  city: string;
  avg_price_per_m2: number;
  price_trend_pct: number;
  total_listings: number;
  total_zones: number;
  top_zones: ZoneMetrics[];
  hottest_zones: ZoneMetrics[]; // highest activity
}

// Supabase Database type (will be auto-generated later, placeholder for now)
export interface Database {
  public: {
    Tables: {
      zones: {
        Row: Zone;
        Insert: Omit<Zone, "id" | "created_at">;
        Update: Partial<Omit<Zone, "id" | "created_at">>;
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, "id" | "created_at">;
        Update: Partial<Omit<Listing, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      property_type: PropertyType;
      listing_type: ListingType;
      source_portal: SourcePortal;
    };
  };
}
