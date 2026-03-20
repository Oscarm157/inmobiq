-- Migration: Alertas de Precios mejoradas
-- Reemplaza la tabla price_alerts simple del migration de auth con un esquema completo.
-- Run manually: psql $DATABASE_URL < supabase/migrations/007_alerts.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tipo de condición de alerta
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE condition_type AS ENUM (
    'price_drop',       -- precio cae un % desde el último snapshot
    'price_below',      -- precio/m² cae por debajo de un umbral absoluto
    'new_listing',      -- nuevo listing en la zona/tipo
    'inventory_change'  -- inventario sube/baja más de X%
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Reemplazar tabla price_alerts con esquema completo
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS price_alerts CASCADE;

CREATE TABLE price_alerts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id           UUID REFERENCES zones(id) ON DELETE CASCADE,
  property_type     TEXT,            -- NULL = todas las categorías
  listing_type      TEXT,            -- 'venta' | 'renta' | NULL = ambas
  condition_type    condition_type NOT NULL,
  threshold_value   NUMERIC NOT NULL, -- % para price_drop/inventory_change, MXN/m² para price_below, 0 para new_listing
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índices
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_price_alerts_user   ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_zone   ON price_alerts(zone_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = TRUE;
