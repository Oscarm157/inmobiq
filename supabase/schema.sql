-- Inmobiq Database Schema
-- Modelo de "snapshots semanales" — no guardamos propiedades individuales,
-- solo los agregados/promedios de cada zona por semana.

-- Enums
CREATE TYPE property_type AS ENUM ('casa', 'departamento', 'terreno', 'local', 'oficina');

-- Zones table (catálogo de zonas/colonias)
CREATE TABLE zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Tijuana',
  state TEXT NOT NULL DEFAULT 'Baja California',
  slug TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly snapshots — la "foto" semanal de cada zona
-- Un registro por zona por semana con los agregados
CREATE TABLE snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- lunes de la semana (ej. 2026-03-16)
  avg_price_per_m2 NUMERIC NOT NULL,
  avg_ticket NUMERIC NOT NULL,
  total_listings INT NOT NULL,
  listings_by_type JSONB NOT NULL DEFAULT '{}', -- {"casa": 45, "departamento": 210, ...}
  avg_ticket_by_type JSONB NOT NULL DEFAULT '{}', -- {"casa": 6200000, ...}
  avg_price_m2_by_type JSONB NOT NULL DEFAULT '{}', -- {"casa": 28000, ...}
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, week_start) -- solo un snapshot por zona por semana
);

-- City-level weekly snapshots (agregado de toda la ciudad)
CREATE TABLE city_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL DEFAULT 'Tijuana',
  week_start DATE NOT NULL,
  avg_price_per_m2 NUMERIC NOT NULL,
  total_listings INT NOT NULL,
  total_zones INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city, week_start)
);

-- Indexes
CREATE INDEX idx_snapshots_zone ON snapshots(zone_id);
CREATE INDEX idx_snapshots_week ON snapshots(week_start DESC);
CREATE INDEX idx_snapshots_zone_week ON snapshots(zone_id, week_start DESC);
CREATE INDEX idx_city_snapshots_week ON city_snapshots(city, week_start DESC);
CREATE INDEX idx_zones_city ON zones(city);
CREATE INDEX idx_zones_slug ON zones(slug);

-- RLS: public read access (no auth required)
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON zones FOR SELECT USING (true);
CREATE POLICY "Public read" ON snapshots FOR SELECT USING (true);
CREATE POLICY "Public read" ON city_snapshots FOR SELECT USING (true);
