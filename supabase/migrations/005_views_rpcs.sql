-- ============================================================
-- 005_views_rpcs.sql
-- Views y RPCs alineados con src/types/database.ts
-- ============================================================

-- ── v_zone_metrics ────────────────────────────────────────────────────────────
-- Alineado con: ZoneMetrics (zone_id, zone_name, zone_slug, avg_price_per_m2,
--   price_trend_pct, avg_ticket, total_listings, listings_by_type, avg_ticket_by_type)
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

-- ── v_city_metrics ────────────────────────────────────────────────────────────
-- Alineado con: CityMetrics (city, avg_price_per_m2, price_trend_pct,
--   total_listings, total_zones)
CREATE OR REPLACE VIEW v_city_metrics AS
WITH current_week AS (
  SELECT
    city,
    SUM(count_active)                           AS total_listings,
    SUM(avg_price_per_m2 * count_active)
      / NULLIF(SUM(count_active), 0)            AS avg_price_per_m2,
    COUNT(DISTINCT cs.week_start)               AS _dummy,
    MAX(cs.total_zones)                         AS total_zones
  FROM city_snapshots cs
  WHERE week_start = (SELECT MAX(week_start) FROM city_snapshots)
  GROUP BY city
),
prev_week AS (
  SELECT
    city,
    SUM(avg_price_per_m2 * count_active)
      / NULLIF(SUM(count_active), 0)            AS avg_price_per_m2
  FROM city_snapshots
  WHERE week_start = (
    SELECT MAX(week_start) FROM city_snapshots
    WHERE week_start < (SELECT MAX(week_start) FROM city_snapshots)
  )
  GROUP BY city
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

-- ── v_zone_risk ───────────────────────────────────────────────────────────────
-- Alineado con: ZoneRiskMetrics (zone_slug, zone_name, risk_score, volatility,
--   cap_rate, vacancy_rate, liquidity_score, market_maturity, avg_rent_per_m2, risk_label)
CREATE OR REPLACE VIEW v_zone_risk AS
WITH venta_stats AS (
  SELECT
    zone_id,
    AVG(avg_price_per_m2)                      AS avg_price_per_m2,
    STDDEV(avg_price_per_m2)                   AS stddev_price_per_m2,
    SUM(count_active)                          AS total_venta
  FROM snapshots
  WHERE listing_type = 'venta'
    AND week_start >= (CURRENT_DATE - INTERVAL '3 months')
  GROUP BY zone_id
),
renta_stats AS (
  SELECT
    zone_id,
    AVG(avg_price_per_m2)                      AS avg_rent_per_m2,
    SUM(count_active)                          AS total_renta
  FROM snapshots
  WHERE listing_type = 'renta'
    AND week_start >= (CURRENT_DATE - INTERVAL '3 months')
  GROUP BY zone_id
),
all_listings AS (
  SELECT zone_id, COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
  FROM listings
  GROUP BY zone_id
)
SELECT
  z.slug                          AS zone_slug,
  z.name                          AS zone_name,

  -- Volatilidad (%) = stddev / avg * 100
  ROUND(COALESCE(
    vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 100, 0
  ), 2)                           AS volatility,

  -- Cap rate estimado (%) = (renta anual / valor) * 100
  ROUND(COALESCE(
    (rs.avg_rent_per_m2 * 12 / NULLIF(vs.avg_price_per_m2, 0)) * 100, 0
  ), 2)                           AS cap_rate,

  -- Vacancy rate (%) = listings inactivos / total
  ROUND(COALESCE(
    (1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 100, 0
  ), 2)                           AS vacancy_rate,

  -- Liquidity score (1-100): más listings activos = más liquidez
  LEAST(100, GREATEST(1,
    ROUND(COALESCE(vs.total_venta, 0)::NUMERIC / 10 + 1, 0)
  ))::INT                         AS liquidity_score,

  -- Market maturity basada en total de listings históricos
  CASE
    WHEN COALESCE(vs.total_venta, 0) < 50  THEN 'emergente'
    WHEN COALESCE(vs.total_venta, 0) < 150 THEN 'en_desarrollo'
    WHEN COALESCE(vs.total_venta, 0) < 400 THEN 'consolidado'
    ELSE                                        'maduro'
  END                             AS market_maturity,

  COALESCE(rs.avg_rent_per_m2, 0) AS avg_rent_per_m2,

  -- Risk score (1-100): ponderación de volatilidad + vacancy
  LEAST(100, GREATEST(1, ROUND(
    COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
    + COALESCE((1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 50, 25)
  , 0)))::INT                     AS risk_score,

  -- Risk label
  CASE
    WHEN LEAST(100, GREATEST(1, ROUND(
      COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
      + COALESCE((1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 50, 25)
    , 0))) < 34  THEN 'Bajo'
    WHEN LEAST(100, GREATEST(1, ROUND(
      COALESCE(vs.stddev_price_per_m2 / NULLIF(vs.avg_price_per_m2, 0) * 50, 25)
      + COALESCE((1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 50, 25)
    , 0))) < 67  THEN 'Medio'
    ELSE 'Alto'
  END                             AS risk_label

FROM zones z
LEFT JOIN venta_stats  vs ON vs.zone_id = z.id
LEFT JOIN renta_stats  rs ON rs.zone_id = z.id
LEFT JOIN all_listings al ON al.zone_id = z.id;

-- ── fn_zone_price_history ─────────────────────────────────────────────────────
-- Serie temporal de precios por zona
-- Retorna: week_start, avg_price_per_m2, count_active, listing_type
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

-- ── fn_portfolio_summary ─────────────────────────────────────────────────────
-- Resumen de portfolio para un conjunto de zonas y tipos de propiedad
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

-- ── fn_search_listings ────────────────────────────────────────────────────────
-- Búsqueda full-text de listings activos con filtros opcionales
CREATE OR REPLACE FUNCTION fn_search_listings(
  p_query          TEXT            DEFAULT NULL,
  p_zone_id        UUID            DEFAULT NULL,
  p_property_type  property_type   DEFAULT NULL,
  p_listing_type   listing_type    DEFAULT NULL,
  p_min_price      NUMERIC         DEFAULT NULL,
  p_max_price      NUMERIC         DEFAULT NULL,
  p_min_area_m2    NUMERIC         DEFAULT NULL,
  p_max_area_m2    NUMERIC         DEFAULT NULL,
  p_bedrooms       SMALLINT        DEFAULT NULL,
  p_limit          INT             DEFAULT 50,
  p_offset         INT             DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  zone_id       UUID,
  zone_name     TEXT,
  zone_slug     TEXT,
  title         TEXT,
  property_type property_type,
  listing_type  listing_type,
  price         NUMERIC,
  area_m2       NUMERIC,
  price_per_m2  NUMERIC,
  bedrooms      SMALLINT,
  bathrooms     SMALLINT,
  source        source_portal,
  source_url    TEXT,
  scraped_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
  SELECT
    l.id,
    l.zone_id,
    z.name                                        AS zone_name,
    z.slug                                        AS zone_slug,
    l.title,
    l.property_type,
    l.listing_type,
    COALESCE(l.price_mxn, l.price_usd)           AS price,
    l.area_m2,
    ROUND(COALESCE(l.price_mxn, l.price_usd)
      / NULLIF(l.area_m2, 0), 2)                 AS price_per_m2,
    l.bedrooms,
    l.bathrooms,
    l.source_portal                               AS source,
    l.external_url                                AS source_url,
    l.scraped_at,
    l.created_at
  FROM listings l
  JOIN zones z ON z.id = l.zone_id
  WHERE l.is_active = true
    AND (p_query       IS NULL OR l.title ILIKE '%' || p_query || '%'
                               OR l.description ILIKE '%' || p_query || '%')
    AND (p_zone_id     IS NULL OR l.zone_id       = p_zone_id)
    AND (p_property_type IS NULL OR l.property_type = p_property_type)
    AND (p_listing_type  IS NULL OR l.listing_type  = p_listing_type)
    AND (p_min_price   IS NULL OR COALESCE(l.price_mxn, l.price_usd) >= p_min_price)
    AND (p_max_price   IS NULL OR COALESCE(l.price_mxn, l.price_usd) <= p_max_price)
    AND (p_min_area_m2 IS NULL OR l.area_m2       >= p_min_area_m2)
    AND (p_max_area_m2 IS NULL OR l.area_m2       <= p_max_area_m2)
    AND (p_bedrooms    IS NULL OR l.bedrooms       = p_bedrooms)
  ORDER BY l.scraped_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
