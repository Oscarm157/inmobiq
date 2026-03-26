export type PropertyType = "casa" | "departamento" | "terreno" | "local" | "oficina";
export type ListingType = "venta" | "renta";
export type SourcePortal = "inmuebles24" | "lamudi" | "vivanuncios" | "mercadolibre" | "otro";

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
  raw_data?: Record<string, unknown>;
  /** Debug: original currency of the listing (price is always stored in MXN after conversion) */
  original_currency?: "MXN" | "USD";
}

export interface Snapshot {
  id: string;
  zone_id: string;
  week_start: string;
  avg_price_per_m2: number;
  avg_ticket: number;
  total_listings: number;
  listings_by_type: Record<PropertyType, number>;
  avg_ticket_by_type: Record<PropertyType, number>;
  avg_price_m2_by_type: Record<PropertyType, number>;
  created_at: string;
}

export interface CitySnapshot {
  id: string;
  city: string;
  week_start: string;
  avg_price_per_m2: number;
  total_listings: number;
  total_zones: number;
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

// Price alerts
export type ConditionType = "price_drop" | "price_below" | "new_listing" | "inventory_change";

export interface PriceAlert {
  id: string;
  user_id: string;
  zone_id: string | null;
  property_type: string | null;
  listing_type: string | null;
  condition_type: ConditionType;
  threshold_value: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
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

// Data quality reports (dev tool)
export type DataReportChartType = "price_distribution" | "scatter" | "concentration" | "ticket_promedio" | "other";
export type DataReportStatus = "open" | "resolved" | "dismissed";

export interface DataReport {
  id: string;
  user_id: string | null;
  zone_slug: string;
  chart_type: DataReportChartType;
  chart_context: Record<string, unknown>;
  description: string;
  status: DataReportStatus;
  created_at: string;
}

// Supabase Database type
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
      snapshots: {
        Row: Snapshot;
        Insert: Omit<Snapshot, "id" | "created_at">;
        Update: Partial<Omit<Snapshot, "id" | "created_at">>;
      };
      city_snapshots: {
        Row: CitySnapshot;
        Insert: Omit<CitySnapshot, "id" | "created_at">;
        Update: Partial<Omit<CitySnapshot, "id" | "created_at">>;
      };
      price_alerts: {
        Row: PriceAlert;
        Insert: Omit<PriceAlert, "id" | "created_at" | "last_triggered_at">;
        Update: Partial<Pick<PriceAlert, "is_active" | "threshold_value" | "condition_type">>;
      };
      user_profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; role: UserRole; created_at: string; updated_at: string };
        Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null; role?: UserRole };
        Update: Partial<{ full_name: string | null; avatar_url: string | null; role: UserRole }>;
      };
      data_reports: {
        Row: DataReport;
        Insert: {
          user_id: string;
          zone_slug: string;
          chart_type: DataReportChartType;
          chart_context?: Record<string, unknown>;
          description: string;
          status?: DataReportStatus;
        };
        Update: Partial<{ status: DataReportStatus }>;
      };
      scrape_jobs: {
        Row: ScrapeJob;
        Insert: {
          user_id: string;
          url: string;
          status?: ScrapeJob["status"];
          extracted_data?: Record<string, unknown> | null;
          normalized_data?: Record<string, unknown> | null;
          listing_id?: string | null;
          error_message?: string | null;
        };
        Update: {
          status?: ScrapeJob["status"];
          extracted_data?: Record<string, unknown> | null;
          normalized_data?: Record<string, unknown> | null;
          listing_id?: string | null;
          error_message?: string | null;
        };
      };
      valuations: {
        Row: Valuation;
        Insert: {
          user_id?: string | null;
          input_mode?: ValuationInputMode;
          status?: ValuationStatus;
          screenshot_paths?: string[];
        };
        Update: Partial<Omit<Valuation, "id" | "created_at">>;
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

export type UserRole = "user" | "admin";

// ── Brújula (property valuation) ──

export type ValuationStatus = "pending" | "extracting" | "preview" | "completed" | "failed";
export type ValuationVerdict = "muy_barata" | "barata" | "precio_justo" | "cara" | "muy_cara";
export type ValuationInputMode = "screenshots" | "manual";

export interface ExtractedPropertyData {
  title: string | null;
  property_type: PropertyType | null;
  listing_type: ListingType | null;
  price: number | null;
  currency: "MXN" | "USD" | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  address: string | null;
  colonia: string | null;
  features: string[];
  confidence_notes: string[];
}

export interface ValuationResult {
  // Zone context
  zone_name: string;
  zone_slug: string;
  zone_avg_price_per_m2: number;
  zone_avg_ticket: number;
  zone_total_listings: number;

  // Price analysis
  price_per_m2: number;
  price_premium_pct: number;
  price_percentile: number;
  price_vs_type_avg_pct: number;

  // Size analysis
  zone_avg_area: number;
  area_vs_zone_avg_pct: number;
  ticket_premium_pct: number;

  // Zone risk profile
  risk_score: number;
  risk_label: string;
  volatility: number;
  liquidity_score: number;
  cap_rate: number | null;

  // Zone demographics
  nse_score: number;
  nse_label: string;
  affordability_index: number;

  // Market context
  price_trend_pct: number;
  demand_pressure: number;
  appreciation_potential: number;

  // Demographics for display
  demographics: {
    population: number;
    households: number;
    pea_ratio: number;
    pct_internet: number;
    pct_car: number;
    pct_social_security: number;
    nse_profile: string;
    nse_profile_color: string;
  } | null;

  // Comparison data (for charts)
  zone_price_distribution: { range: string; count: number; has_property: boolean }[];
  comparable_listings: { price: number; area_m2: number; type: PropertyType; price_per_m2: number }[];

  // Verdict
  score: number;
  verdict: ValuationVerdict;
  verdict_reasons: string[];
}

export interface Valuation {
  id: string;
  user_id: string | null;
  status: ValuationStatus;
  input_mode: ValuationInputMode;
  screenshot_paths: string[];
  extracted_data: ExtractedPropertyData | null;
  property_type: PropertyType | null;
  listing_type: ListingType | null;
  price_mxn: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  address: string | null;
  zone_id: string | null;
  zone_slug: string | null;
  zone_assignment_method: string | null;
  valuation_result: ValuationResult | null;
  verdict: ValuationVerdict | null;
  score: number | null;
  narrative: string | null;
  ai_model: string | null;
  ai_input_tokens: number;
  ai_output_tokens: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeJob {
  id: string;
  user_id: string;
  url: string;
  status: "pending" | "scraping" | "extracting" | "preview" | "saved" | "failed";
  extracted_data: Record<string, unknown> | null;
  normalized_data: Record<string, unknown> | null;
  listing_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
