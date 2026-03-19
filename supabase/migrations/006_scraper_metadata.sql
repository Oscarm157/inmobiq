-- ============================================================
-- 006_scraper_metadata.sql
-- Tablas de control y auditoría de scraper runs
-- ============================================================

-- Estado posible de un run
CREATE TYPE scraper_status AS ENUM ('running', 'completed', 'failed', 'cancelled');

-- Registro de cada ejecución del scraper
CREATE TABLE scraper_runs (
  id                UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  portal            source_portal  NOT NULL,
  status            scraper_status NOT NULL DEFAULT 'running',
  started_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  listings_found    INT            NOT NULL DEFAULT 0,
  listings_new      INT            NOT NULL DEFAULT 0,
  listings_updated  INT            NOT NULL DEFAULT 0,
  errors            JSONB          NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ    DEFAULT now()
);

-- Errores individuales del scraper
CREATE TABLE scraper_errors (
  id            UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id        UUID           NOT NULL REFERENCES scraper_runs(id) ON DELETE CASCADE,
  portal        source_portal  NOT NULL,
  url           TEXT,
  error_type    TEXT           NOT NULL,
  error_message TEXT           NOT NULL,
  created_at    TIMESTAMPTZ    DEFAULT now()
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_scraper_runs_portal     ON scraper_runs(portal);
CREATE INDEX idx_scraper_runs_status     ON scraper_runs(status);
CREATE INDEX idx_scraper_runs_started_at ON scraper_runs(started_at DESC);

CREATE INDEX idx_scraper_errors_run_id   ON scraper_errors(run_id);
CREATE INDEX idx_scraper_errors_portal   ON scraper_errors(portal);
