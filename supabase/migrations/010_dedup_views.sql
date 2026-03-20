-- ============================================================
-- 010_dedup_views.sql
-- Actualizar views y RPCs para usar listings deduplicados
-- ============================================================

-- ── fn_search_listings: excluir non-canonical cluster members ────────────────
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
    AND (
      l.cluster_id IS NULL
      OR l.id = (SELECT pc.canonical_listing_id FROM property_clusters pc WHERE pc.id = l.cluster_id)
    )
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

-- ── v_zone_risk: contar solo propiedades únicas ─────────────────────────────
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
  SELECT zone_id,
    COUNT(*) AS total,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
  FROM listings
  WHERE cluster_id IS NULL
    OR id = (SELECT pc.canonical_listing_id FROM property_clusters pc WHERE pc.id = listings.cluster_id)
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
  ROUND(COALESCE(
    (1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 100, 0
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
    + COALESCE((1 - al.active::NUMERIC / NULLIF(al.total, 0)) * 50, 25)
  , 0)))::INT                     AS risk_score,
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
