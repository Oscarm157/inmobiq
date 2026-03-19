-- ============================================================
-- 001_base_schema.sql
-- Enums, tabla zones y seed data con coordenadas reales de Tijuana
-- ============================================================

-- Enums
CREATE TYPE property_type AS ENUM ('casa', 'departamento', 'terreno', 'local', 'oficina');
CREATE TYPE listing_type   AS ENUM ('venta', 'renta');
CREATE TYPE source_portal  AS ENUM ('inmuebles24', 'lamudi', 'vivanuncios', 'mercadolibre');

-- Tabla zones (catálogo de zonas/colonias)
CREATE TABLE zones (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT          NOT NULL,
  city            TEXT          NOT NULL DEFAULT 'Tijuana',
  state           TEXT          NOT NULL DEFAULT 'Baja California',
  slug            TEXT          NOT NULL UNIQUE,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  polygon_geojson JSONB,           -- GeoJSON polygon para el mapa; NULL hasta que se cargue
  created_at      TIMESTAMPTZ   DEFAULT now()
);

-- ── Seed: 8 zonas de Tijuana con coordenadas reales ──────────────────────────
INSERT INTO zones (name, slug, lat, lng) VALUES
  ('Zona Río',             'zona-rio',              32.5160, -117.0350),
  ('Playas de Tijuana',    'playas-de-tijuana',     32.5249, -117.1234),
  ('Otay',                 'otay',                  32.5330, -116.9680),
  ('Chapultepec',          'chapultepec',           32.5185, -116.9905),
  ('Hipódromo',            'hipodromo',             32.5035, -116.9975),
  ('Centro',               'centro',                32.5323, -117.0350),
  ('Residencial del Bosque','residencial-del-bosque',32.4980, -117.0050),
  ('La Mesa',              'la-mesa',               32.5248, -116.9634);
