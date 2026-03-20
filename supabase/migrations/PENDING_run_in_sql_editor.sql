-- ============================================================
-- MIGRACIONES PENDIENTES - Pegar en SQL Editor de Supabase
-- Ejecutar en orden: listings → dedup → dedup views → auth
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. TABLA LISTINGS (002_listings.sql)
-- ════════════════════════════════════════════════════════════

CREATE TABLE listings (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id       UUID          NOT NULL REFERENCES zones(id) ON DELETE SET NULL,

  -- Fuente
  source_portal source_portal NOT NULL,
  external_id   TEXT          NOT NULL,
  external_url  TEXT          NOT NULL,

  -- Datos básicos
  title         TEXT,
  description   TEXT,
  property_type property_type NOT NULL,
  listing_type  listing_type  NOT NULL,

  -- Precios
  price_mxn     NUMERIC,
  price_usd     NUMERIC,
  area_m2       NUMERIC,
  bedrooms      SMALLINT,
  bathrooms     SMALLINT,
  parking       SMALLINT,

  -- Ubicación
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  address       TEXT,

  -- Datos adicionales
  images        JSONB          DEFAULT '[]',
  raw_data      JSONB          DEFAULT '{}',

  -- Control de tiempo
  scraped_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  first_seen_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  is_active     BOOLEAN        NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ    DEFAULT now(),
  updated_at    TIMESTAMPTZ    DEFAULT now(),

  CONSTRAINT uq_source_external UNIQUE (source_portal, external_id)
);

CREATE INDEX idx_listings_zone_id       ON listings(zone_id);
CREATE INDEX idx_listings_source_portal ON listings(source_portal);
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_listing_type  ON listings(listing_type);
CREATE INDEX idx_listings_price_mxn     ON listings(price_mxn);
CREATE INDEX idx_listings_is_active     ON listings(is_active);
CREATE INDEX idx_listings_active_zone   ON listings(zone_id, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════
-- 2. DEDUP (009_dedup.sql)
-- ════════════════════════════════════════════════════════════

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS fingerprint_struct TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint_geo    TEXT,
  ADD COLUMN IF NOT EXISTS cluster_id         UUID;

CREATE INDEX IF NOT EXISTS idx_listings_fp_struct
  ON listings(fingerprint_struct) WHERE fingerprint_struct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_fp_geo
  ON listings(fingerprint_geo) WHERE fingerprint_geo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_cluster_id
  ON listings(cluster_id) WHERE cluster_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS property_clusters (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  listing_count        INT  NOT NULL DEFAULT 1,
  portals              source_portal[] NOT NULL DEFAULT '{}',
  fingerprint_struct   TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clusters_canonical
  ON property_clusters(canonical_listing_id);
CREATE INDEX IF NOT EXISTS idx_clusters_fp_struct
  ON property_clusters(fingerprint_struct) WHERE fingerprint_struct IS NOT NULL;

CREATE OR REPLACE VIEW v_deduplicated_listings AS
SELECT l.*
FROM listings l
WHERE l.is_active = true
  AND (
    l.cluster_id IS NULL
    OR l.id = (
      SELECT pc.canonical_listing_id
      FROM property_clusters pc
      WHERE pc.id = l.cluster_id
    )
  );

-- ════════════════════════════════════════════════════════════
-- 3. DEDUP VIEWS (010_dedup_views.sql)
-- ════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════
-- 4. AUTH & USER PROFILES (20260319_auth_and_user_profiles.sql)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS portfolio_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portfolio_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own presets"
  ON portfolio_presets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_presets_user ON portfolio_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_zone ON price_alerts(zone_id);
