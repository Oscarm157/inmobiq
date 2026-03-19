-- ============================================================
-- 002_listings.sql
-- Tabla listings: propiedades individuales scrapeadas
-- ============================================================

CREATE TABLE listings (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id       UUID          NOT NULL REFERENCES zones(id) ON DELETE SET NULL,

  -- Fuente
  source_portal source_portal NOT NULL,
  external_id   TEXT          NOT NULL,
  external_url  TEXT          NOT NULL,

  -- Datos básicos (alineados con TS Listing interface)
  title         TEXT,
  description   TEXT,
  property_type property_type NOT NULL,
  listing_type  listing_type  NOT NULL,

  -- Precios
  price_mxn     NUMERIC,                       -- precio en MXN (fuente primaria)
  price_usd     NUMERIC,                       -- precio en USD (cuando el portal lo reporta)
  area_m2       NUMERIC,
  bedrooms      SMALLINT,
  bathrooms     SMALLINT,
  parking       SMALLINT,

  -- Ubicación
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  address       TEXT,

  -- Datos adicionales
  images        JSONB          DEFAULT '[]',   -- array de URLs
  raw_data      JSONB          DEFAULT '{}',   -- payload crudo del scraper

  -- Control de tiempo
  scraped_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  first_seen_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  is_active     BOOLEAN        NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ    DEFAULT now(),
  updated_at    TIMESTAMPTZ    DEFAULT now(),

  -- Dedup: un listing por portal + id externo
  CONSTRAINT uq_source_external UNIQUE (source_portal, external_id)
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_listings_zone_id       ON listings(zone_id);
CREATE INDEX idx_listings_source_portal ON listings(source_portal);
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_listing_type  ON listings(listing_type);
CREATE INDEX idx_listings_price_mxn     ON listings(price_mxn);
CREATE INDEX idx_listings_is_active     ON listings(is_active);
CREATE INDEX idx_listings_active_zone   ON listings(zone_id, is_active) WHERE is_active = true;

-- ── Trigger: mantener updated_at al día ──────────────────────────────────────
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
