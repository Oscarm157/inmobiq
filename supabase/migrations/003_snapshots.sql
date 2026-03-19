-- ============================================================
-- 003_snapshots.sql
-- Snapshots semanales por zona y por ciudad
-- ============================================================

-- Snapshot semanal por zona
CREATE TABLE snapshots (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id           UUID          NOT NULL REFERENCES zones(id) ON DELETE CASCADE,

  week_start        DATE          NOT NULL,  -- lunes de la semana (ej. 2026-03-16)
  property_type     property_type NOT NULL,
  listing_type      listing_type  NOT NULL,

  -- Métricas de inventario
  count_active      INT           NOT NULL DEFAULT 0,
  new_listings      INT           NOT NULL DEFAULT 0,
  removed_listings  INT           NOT NULL DEFAULT 0,

  -- Métricas de precio
  avg_price         NUMERIC,
  median_price      NUMERIC,
  min_price         NUMERIC,
  max_price         NUMERIC,
  avg_price_per_m2  NUMERIC,
  total_area_m2     NUMERIC,

  created_at        TIMESTAMPTZ   DEFAULT now(),

  CONSTRAINT uq_snapshot UNIQUE (zone_id, week_start, property_type, listing_type)
);

-- Snapshot semanal a nivel ciudad
CREATE TABLE city_snapshots (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  city              TEXT          NOT NULL DEFAULT 'Tijuana',

  week_start        DATE          NOT NULL,
  property_type     property_type NOT NULL,
  listing_type      listing_type  NOT NULL,

  -- Métricas de inventario
  count_active      INT           NOT NULL DEFAULT 0,
  new_listings      INT           NOT NULL DEFAULT 0,
  removed_listings  INT           NOT NULL DEFAULT 0,

  -- Métricas de precio
  avg_price         NUMERIC,
  median_price      NUMERIC,
  min_price         NUMERIC,
  max_price         NUMERIC,
  avg_price_per_m2  NUMERIC,
  total_area_m2     NUMERIC,
  total_zones       INT           NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ   DEFAULT now(),

  CONSTRAINT uq_city_snapshot UNIQUE (city, week_start, property_type, listing_type)
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_snapshots_zone_id    ON snapshots(zone_id);
CREATE INDEX idx_snapshots_week_start ON snapshots(week_start DESC);
CREATE INDEX idx_snapshots_zone_week  ON snapshots(zone_id, week_start DESC);

CREATE INDEX idx_city_snapshots_week  ON city_snapshots(city, week_start DESC);
