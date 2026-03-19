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

// Risk analysis per zone
export interface ZoneRiskMetrics {
  zone_slug: string;
  zone_name: string;
  risk_score: number; // 1-100, higher = riskier
  volatility: number; // price volatility %
  cap_rate: number; // capitalization rate %
  vacancy_rate: number; // vacancy %
  liquidity_score: number; // 1-100, higher = more liquid
  market_maturity: "emergente" | "en_desarrollo" | "consolidado" | "maduro";
  avg_rent_per_m2: number;
  risk_label: "Bajo" | "Medio" | "Alto";
}

// Portfolio presets
export type RiskLevel = "conservador" | "balanceado" | "agresivo";

export interface PortfolioAllocation {
  zone_slug: string;
  zone_name: string;
  allocation_pct: number;
}

export interface PortfolioPreset {
  id: string;
  name: string;
  description: string;
  risk_level: RiskLevel;
  expected_return_pct: number;
  risk_score: number;
  allocations: PortfolioAllocation[];
}

// Pipeline projects
export type ProjectStatus = "planificacion" | "preventa" | "construccion" | "entregado";

export interface PipelineProject {
  id: string;
  zone_slug: string;
  zone_name: string;
  name: string;
  status: ProjectStatus;
  status_label: string;
  badge_color: string;
  description: string;
  units_total: number;
  units_sold: number;
  price_range: string;
  delivery_date: string;
  img: string;
  investors: number;
  investor_label: string;
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
