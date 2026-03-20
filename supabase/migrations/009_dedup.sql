-- ============================================================
-- 009_dedup.sql
-- Deduplicación de listings: fingerprints + clusters
-- ============================================================

-- ── Nuevas columnas en listings ─────────────────────────────────────────────
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

-- ── Tabla property_clusters ─────────────────────────────────────────────────
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

-- ── Vista: listings deduplicados ────────────────────────────────────────────
-- Solo muestra listings que son canonical en su cluster, o que no tienen cluster
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
