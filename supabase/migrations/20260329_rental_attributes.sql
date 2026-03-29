-- ============================================================
-- 20260329_rental_attributes.sql
-- Add rental-specific columns to listings table + rental_snapshots table
-- ============================================================

-- ── Rental attribute columns on listings ────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS maintenance_fee NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_months SMALLINT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lease_term_months SMALLINT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_short_term BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS utilities_included BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Partial indexes for common rental queries
CREATE INDEX IF NOT EXISTS idx_listings_furnished
  ON listings(is_furnished) WHERE listing_type = 'renta' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_short_term
  ON listings(is_short_term) WHERE listing_type = 'renta' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_renta_active
  ON listings(zone_id, listing_type) WHERE listing_type = 'renta' AND is_active = true;

-- ── Rental snapshots table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS rental_snapshots (
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id                 UUID          NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  week_start              DATE          NOT NULL,

  -- Core rental metrics
  avg_rent_per_m2         NUMERIC,
  median_rent             NUMERIC,
  total_rental_listings   INTEGER       DEFAULT 0,

  -- Furnished breakdown
  furnished_count         INTEGER       DEFAULT 0,
  unfurnished_count       INTEGER       DEFAULT 0,
  furnished_premium_pct   NUMERIC,

  -- Currency breakdown
  usd_listings_count      INTEGER       DEFAULT 0,

  -- Demand proxies
  avg_listing_duration_days NUMERIC,

  -- Maintenance stats
  median_maintenance_fee  NUMERIC,

  created_at              TIMESTAMPTZ   DEFAULT now(),

  CONSTRAINT uq_rental_snapshot UNIQUE (zone_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_rental_snapshots_zone_week
  ON rental_snapshots(zone_id, week_start DESC);
