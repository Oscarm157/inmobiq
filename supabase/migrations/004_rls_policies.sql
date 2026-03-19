-- ============================================================
-- 004_rls_policies.sql
-- Row Level Security: lectura pública sin autenticación
-- ============================================================

-- ── zones ─────────────────────────────────────────────────────────────────────
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read zones"
  ON zones FOR SELECT
  USING (true);

-- ── listings ──────────────────────────────────────────────────────────────────
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Solo listings activos son visibles públicamente
CREATE POLICY "Public read active listings"
  ON listings FOR SELECT
  USING (is_active = true);

-- ── snapshots ─────────────────────────────────────────────────────────────────
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read snapshots"
  ON snapshots FOR SELECT
  USING (true);

-- ── city_snapshots ────────────────────────────────────────────────────────────
ALTER TABLE city_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read city_snapshots"
  ON city_snapshots FOR SELECT
  USING (true);
