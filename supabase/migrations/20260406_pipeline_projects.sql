-- Pipeline projects table: real estate development projects in Tijuana
CREATE TABLE IF NOT EXISTS pipeline_projects (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_slug     TEXT NOT NULL REFERENCES zones(slug),
  name          TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('planificacion', 'preventa', 'construccion', 'entregado')),
  status_label  TEXT NOT NULL,
  badge_color   TEXT NOT NULL DEFAULT 'bg-blue-100 text-blue-700',
  description   TEXT NOT NULL,
  units_total   INT NOT NULL DEFAULT 0,
  units_sold    INT NOT NULL DEFAULT 0,
  price_range   TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  img_url       TEXT,
  investors     INT NOT NULL DEFAULT 0,
  investor_label TEXT NOT NULL DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pipeline_projects ENABLE ROW LEVEL SECURITY;

-- Public read (active projects only)
CREATE POLICY "Anyone can read active projects"
  ON pipeline_projects FOR SELECT
  USING (is_active = TRUE);

-- Admin write
CREATE POLICY "Admins manage projects"
  ON pipeline_projects FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Index for zone filtering
CREATE INDEX idx_pipeline_projects_zone ON pipeline_projects(zone_slug);
CREATE INDEX idx_pipeline_projects_status ON pipeline_projects(status);
