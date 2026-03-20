-- ============================================================
-- Inmobiq — Schema limpio (sin listings individuales)
-- Inteligencia de mercado: snapshots agregados por zona
-- ============================================================
-- INSTRUCCIONES:
-- 1. En Supabase SQL Editor, primero corre el DROP de abajo para limpiar
-- 2. Luego corre todo este archivo

-- ── LIMPIEZA ────────────────────────────────────────────────
DROP FUNCTION IF EXISTS fn_zone_price_history CASCADE;
DROP FUNCTION IF EXISTS fn_portfolio_summary CASCADE;
DROP FUNCTION IF EXISTS fn_search_listings CASCADE;
DROP VIEW IF EXISTS v_zone_risk CASCADE;
DROP VIEW IF EXISTS v_city_metrics CASCADE;
DROP VIEW IF EXISTS v_zone_metrics CASCADE;
DROP TABLE IF EXISTS scraper_errors CASCADE;
DROP TABLE IF EXISTS scraper_runs CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS city_snapshots CASCADE;
DROP TABLE IF EXISTS snapshots CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TYPE IF EXISTS source_portal CASCADE;
DROP TYPE IF EXISTS listing_type CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;

-- ── ENUMS ───────────────────────────────────────────────────
CREATE TYPE property_type AS ENUM ('casa', 'departamento', 'terreno', 'local', 'oficina');
CREATE TYPE listing_type  AS ENUM ('venta', 'renta');
CREATE TYPE source_portal AS ENUM ('inmuebles24', 'lamudi', 'vivanuncios', 'mercadolibre');

-- ── ZONES ───────────────────────────────────────────────────
CREATE TABLE zones (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT          NOT NULL,
  city            TEXT          NOT NULL DEFAULT 'Tijuana',
  state           TEXT          NOT NULL DEFAULT 'Baja California',
  slug            TEXT          NOT NULL UNIQUE,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  polygon_geojson JSONB,
  created_at      TIMESTAMPTZ   DEFAULT now()
);

-- Seed: 8 zonas de Tijuana
INSERT INTO zones (name, slug, lat, lng) VALUES
  ('Zona Río',              'zona-rio',               32.5160, -117.0350),
  ('Playas de Tijuana',     'playas-de-tijuana',       32.5249, -117.1234),
  ('Otay',                  'otay',                    32.5330, -116.9680),
  ('Chapultepec',           'chapultepec',             32.5185, -116.9905),
  ('Hipódromo',             'hipodromo',               32.5035, -116.9975),
  ('Centro',                'centro',                  32.5323, -117.0350),
  ('Residencial del Bosque','residencial-del-bosque',  32.4980, -117.0050),
  ('La Mesa',               'la-mesa',                 32.5248, -116.9634);

-- ── SNAPSHOTS (por zona, por semana, por tipo) ──────────────
-- Un registro = una foto semanal de UNA zona + UN property_type + UN listing_type
-- Ejemplo: Zona Río / casa / venta / semana 2026-03-16
CREATE TABLE snapshots (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id          UUID          NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  week_start       DATE          NOT NULL,
  property_type    property_type NOT NULL,
  listing_type     listing_type  NOT NULL,
  count_active     INT           NOT NULL DEFAULT 0,
  avg_price        NUMERIC       NOT NULL DEFAULT 0,
  median_price     NUMERIC       NOT NULL DEFAULT 0,
  min_price        NUMERIC       NOT NULL DEFAULT 0,
  max_price        NUMERIC       NOT NULL DEFAULT 0,
  avg_price_per_m2 NUMERIC       NOT NULL DEFAULT 0,
  total_area_m2    NUMERIC       NOT NULL DEFAULT 0,
  new_listings     INT           NOT NULL DEFAULT 0,
  removed_listings INT           NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT now(),
  UNIQUE(zone_id, week_start, property_type, listing_type)
);

-- ── CITY SNAPSHOTS (agregado ciudad) ────────────────────────
CREATE TABLE city_snapshots (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  city             TEXT          NOT NULL DEFAULT 'Tijuana',
  week_start       DATE          NOT NULL,
  avg_price_per_m2 NUMERIC       NOT NULL DEFAULT 0,
  count_active     INT           NOT NULL DEFAULT 0,
  total_zones      INT           NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT now(),
  UNIQUE(city, week_start)
);

-- ── SCRAPER METADATA ────────────────────────────────────────
CREATE TABLE scraper_runs (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  portal           source_portal NOT NULL,
  status           TEXT          NOT NULL DEFAULT 'running',
  started_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  listings_found   INT           DEFAULT 0,
  listings_new     INT           DEFAULT 0,
  listings_updated INT           DEFAULT 0,
  errors           JSONB         DEFAULT '[]',
  created_at       TIMESTAMPTZ   DEFAULT now()
);

CREATE TABLE scraper_errors (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id           UUID          NOT NULL REFERENCES scraper_runs(id) ON DELETE CASCADE,
  portal           source_portal NOT NULL,
  url              TEXT,
  error_type       TEXT          NOT NULL,
  error_message    TEXT          NOT NULL,
  created_at       TIMESTAMPTZ   DEFAULT now()
);

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_snapshots_zone       ON snapshots(zone_id);
CREATE INDEX idx_snapshots_week       ON snapshots(week_start DESC);
CREATE INDEX idx_snapshots_zone_week  ON snapshots(zone_id, week_start DESC);
CREATE INDEX idx_city_snapshots_week  ON city_snapshots(city, week_start DESC);
CREATE INDEX idx_zones_slug           ON zones(slug);
CREATE INDEX idx_scraper_runs_portal  ON scraper_runs(portal, started_at DESC);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE zones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON zones          FOR SELECT USING (true);
CREATE POLICY "Public read" ON snapshots      FOR SELECT USING (true);
CREATE POLICY "Public read" ON city_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read" ON scraper_runs   FOR SELECT USING (true);

-- ── VIEW: v_zone_metrics ────────────────────────────────────
-- Métricas actuales por zona (precio/m², tendencia, total listings)
CREATE OR REPLACE VIEW v_zone_metrics AS
WITH current_week AS (
  SELECT
    zone_id,
    SUM(count_active)                             AS total_listings,
    SUM(avg_price_per_m2 * count_active)
      / NULLIF(SUM(count_active), 0)              AS avg_price_per_m2,
    SUM(avg_price * count_active)
      / NULLIF(SUM(count_active), 0)              AS avg_ticket
  FROM snapshots
  WHERE week_start = (SELECT MAX(week_start) FROM snapshots)
  GROUP BY zone_id
),
prev_week AS (
  SELECT
    zone_id,
    SUM(avg_price_per_m2 * count_active)
      / NULLIF(SUM(count_active), 0)              AS avg_price_per_m2
  FROM snapshots
  WHERE week_start = (
    SELECT MAX(week_start) FROM snapshots
    WHERE week_start < (SELECT MAX(week_start) FROM snapshots)
  )
  GROUP BY zone_id
),
by_property AS (
  SELECT
    zone_id,
    jsonb_object_agg(property_type::text, COALESCE(count_active, 0))
      AS listings_by_type,
    jsonb_object_agg(property_type::text, COALESCE(avg_price, 0))
      AS avg_ticket_by_type
  FROM snapshots
  WHERE week_start = (SELECT MAX(week_start) FROM snapshots)
    AND listing_type = 'venta'
  GROUP BY zone_id
)
SELECT
  z.id                          AS zone_id,
  z.name                        AS zone_name,
  z.slug                        AS zone_slug,
  COALESCE(cw.avg_price_per_m2, 0)           AS avg_price_per_m2,
  ROUND(
    CASE
      WHEN COALESCE(pw.avg_price_per_m2, 0) = 0 THEN 0
      ELSE ((cw.avg_price_per_m2 - pw.avg_price_per_m2) / pw.avg_price_per_m2 * 100)
    END, 2
  )                             AS price_trend_pct,
  COALESCE(cw.avg_ticket, 0)   AS avg_ticket,
  COALESCE(cw.total_listings, 0)::INT        AS total_listings,
  COALESCE(bp.listings_by_type, '{}'::JSONB) AS listings_by_type,
  COALESCE(bp.avg_ticket_by_type, '{}'::JSONB) AS avg_ticket_by_type
FROM zones z
LEFT JOIN current_week cw  ON cw.zone_id  = z.id
LEFT JOIN prev_week    pw  ON pw.zone_id  = z.id
LEFT JOIN by_property  bp  ON bp.zone_id  = z.id;

-- ── VIEW: v_city_metrics ────────────────────────────────────
CREATE OR REPLACE VIEW v_city_metrics AS
WITH current_week AS (
  SELECT
    city,
    avg_price_per_m2,
    count_active     AS total_listings,
    total_zones
  FROM city_snapshots
  WHERE week_start = (SELECT MAX(week_start) FROM city_snapshots)
),
prev_week AS (
  SELECT
    city,
    avg_price_per_m2
  FROM city_snapshots
  WHERE week_start = (
    SELECT MAX(week_start) FROM city_snapshots
    WHERE week_start < (SELECT MAX(week_start) FROM city_snapshots)
  )
)
SELECT
  cw.city,
  COALESCE(cw.avg_price_per_m2, 0)             AS avg_price_per_m2,
  ROUND(
    CASE
      WHEN COALESCE(pw.avg_price_per_m2, 0) = 0 THEN 0
      ELSE ((cw.avg_price_per_m2 - pw.avg_price_per_m2) / pw.avg_price_per_m2 * 100)
    END, 2
  )                                             AS price_trend_pct,
  COALESCE(cw.total_listings, 0)::INT          AS total_listings,
  COALESCE(cw.total_zones, 0)::INT             AS total_zones
FROM current_week cw
LEFT JOIN prev_week pw ON pw.city = cw.city;

-- ── VIEW: v_zone_risk ───────────────────────────────────────
-- Riesgo por zona basado en volatilidad de precios y datos de renta
CREATE OR REPLACE VIEW v_zone_risk AS
WITH venta_stats AS (
  SELECT
    zone_id,
    AVG(avg_price_per_m2)    AS avg_price_per_m2,
    STDDEV(avg_price_per_m2) AS stddev_price_per_m2,
    SUM(count_active)        AS total_venta
  FROM snapshots
  WHERE listing_type = 'venta'
    AND week_start >= (CURRENT_DATE - INTERVAL '3 months')
  GROUP BY zone_id
),
renta_stats AS (
  SELECT
    zone_id,
    AVG(avg_price_per_m2)    AS avg_rent_per_m2,
    SUM(count_active)        AS total_renta
  FROM snapshots
  WHERE listing_type = 'renta'
    AND week_start >= (CURRENT_DATE - INTERVAL '3 months')
  GROUP BY zone_id
)
SELECT
  z.slug                          AS zone_slug,
  z.name                          AS zone_name,

  ROUND(COALESCE(
    vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 100, 0
  ), 2)                           AS volatility,

  ROUND(COALESCE(
    (rs.avg_rent_per_m2 * 12 / NULLIF(vs.avg_price_per_m2, 0)) * 100, 0
  ), 2)                           AS cap_rate,

  -- Vacancy estimado desde ratio renta/venta
  ROUND(COALESCE(
    CASE
      WHEN COALESCE(vs.total_venta, 0) + COALESCE(rs.total_renta, 0) = 0 THEN 0
      ELSE rs.total_renta::NUMERIC / (vs.total_venta + rs.total_renta) * 100
    END, 0
  ), 2)                           AS vacancy_rate,

  LEAST(100, GREATEST(1,
    ROUND(COALESCE(vs.total_venta, 0)::NUMERIC / 10 + 1, 0)
  ))::INT                         AS liquidity_score,

  CASE
    WHEN COALESCE(vs.total_venta, 0) < 50  THEN 'emergente'
    WHEN COALESCE(vs.total_venta, 0) < 150 THEN 'en_desarrollo'
    WHEN COALESCE(vs.total_venta, 0) < 400 THEN 'consolidado'
    ELSE                                        'maduro'
  END                             AS market_maturity,

  COALESCE(rs.avg_rent_per_m2, 0) AS avg_rent_per_m2,

  LEAST(100, GREATEST(1, ROUND(
    COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
    + COALESCE(
        CASE
          WHEN COALESCE(vs.total_venta, 0) + COALESCE(rs.total_renta, 0) = 0 THEN 25
          ELSE rs.total_renta::NUMERIC / (vs.total_venta + rs.total_renta) * 50
        END, 25)
  , 0)))::INT                     AS risk_score,

  CASE
    WHEN LEAST(100, GREATEST(1, ROUND(
      COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
      + COALESCE(
          CASE
            WHEN COALESCE(vs.total_venta, 0) + COALESCE(rs.total_renta, 0) = 0 THEN 25
            ELSE rs.total_renta::NUMERIC / (vs.total_venta + rs.total_renta) * 50
          END, 25)
    , 0))) < 34  THEN 'Bajo'
    WHEN LEAST(100, GREATEST(1, ROUND(
      COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
      + COALESCE(
          CASE
            WHEN COALESCE(vs.total_venta, 0) + COALESCE(rs.total_renta, 0) = 0 THEN 25
            ELSE rs.total_renta::NUMERIC / (vs.total_venta + rs.total_renta) * 50
          END, 25)
    , 0))) < 67  THEN 'Medio'
    ELSE 'Alto'
  END                             AS risk_label

FROM zones z
LEFT JOIN venta_stats vs ON vs.zone_id = z.id
LEFT JOIN renta_stats rs ON rs.zone_id = z.id;

-- ── FUNCTION: fn_zone_price_history ─────────────────────────
-- Serie temporal de precios por zona (para gráficas)
CREATE OR REPLACE FUNCTION fn_zone_price_history(
  p_zone_slug   TEXT,
  p_months      INT DEFAULT 6
)
RETURNS TABLE (
  week_start       DATE,
  avg_price_per_m2 NUMERIC,
  count_active     INT,
  listing_type     listing_type
)
LANGUAGE sql STABLE AS $$
  SELECT
    s.week_start,
    ROUND(
      SUM(s.avg_price_per_m2 * s.count_active)
      / NULLIF(SUM(s.count_active), 0)
    , 2)                                   AS avg_price_per_m2,
    SUM(s.count_active)::INT               AS count_active,
    s.listing_type
  FROM snapshots s
  JOIN zones z ON z.id = s.zone_id
  WHERE z.slug = p_zone_slug
    AND s.week_start >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
  GROUP BY s.week_start, s.listing_type
  ORDER BY s.week_start ASC;
$$;

-- ── FUNCTION: fn_portfolio_summary ──────────────────────────
-- Resumen de métricas para un conjunto de zonas
CREATE OR REPLACE FUNCTION fn_portfolio_summary(
  p_zone_ids       UUID[],
  p_property_types property_type[] DEFAULT NULL
)
RETURNS TABLE (
  zone_id          UUID,
  zone_name        TEXT,
  zone_slug        TEXT,
  property_type    property_type,
  count_active     INT,
  avg_price        NUMERIC,
  avg_price_per_m2 NUMERIC,
  avg_rent_per_m2  NUMERIC,
  cap_rate         NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH venta AS (
    SELECT
      s.zone_id,
      s.property_type,
      SUM(s.count_active)::INT                                         AS count_active,
      ROUND(SUM(s.avg_price * s.count_active)
        / NULLIF(SUM(s.count_active), 0), 2)                          AS avg_price,
      ROUND(SUM(s.avg_price_per_m2 * s.count_active)
        / NULLIF(SUM(s.count_active), 0), 2)                          AS avg_price_per_m2
    FROM snapshots s
    WHERE s.zone_id = ANY(p_zone_ids)
      AND s.listing_type = 'venta'
      AND (p_property_types IS NULL OR s.property_type = ANY(p_property_types))
      AND s.week_start = (SELECT MAX(week_start) FROM snapshots)
    GROUP BY s.zone_id, s.property_type
  ),
  renta AS (
    SELECT
      s.zone_id,
      s.property_type,
      ROUND(SUM(s.avg_price_per_m2 * s.count_active)
        / NULLIF(SUM(s.count_active), 0), 2)                          AS avg_rent_per_m2
    FROM snapshots s
    WHERE s.zone_id = ANY(p_zone_ids)
      AND s.listing_type = 'renta'
      AND (p_property_types IS NULL OR s.property_type = ANY(p_property_types))
      AND s.week_start = (SELECT MAX(week_start) FROM snapshots)
    GROUP BY s.zone_id, s.property_type
  )
  SELECT
    v.zone_id,
    z.name                                                              AS zone_name,
    z.slug                                                              AS zone_slug,
    v.property_type,
    v.count_active,
    v.avg_price,
    v.avg_price_per_m2,
    COALESCE(r.avg_rent_per_m2, 0)                                     AS avg_rent_per_m2,
    ROUND(
      COALESCE(r.avg_rent_per_m2, 0) * 12
      / NULLIF(v.avg_price_per_m2, 0) * 100
    , 2)                                                               AS cap_rate
  FROM venta v
  JOIN zones z ON z.id = v.zone_id
  LEFT JOIN renta r ON r.zone_id = v.zone_id AND r.property_type = v.property_type
  ORDER BY z.name, v.property_type;
$$;
