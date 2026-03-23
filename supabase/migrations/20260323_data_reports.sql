-- ──────────────────────────────────────────────────────────────
-- Data quality reports — dev tool for flagging suspicious listings
-- ──────────────────────────────────────────────────────────────

CREATE TABLE data_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  zone_slug TEXT NOT NULL,
  chart_type TEXT NOT NULL CHECK (chart_type IN ('price_distribution', 'scatter', 'concentration', 'ticket_promedio', 'other')),
  chart_context JSONB NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE data_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create reports
CREATE POLICY "Authenticated users create reports"
  ON data_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can see their own reports
CREATE POLICY "Users read own reports"
  ON data_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see and manage all reports
CREATE POLICY "Admins manage all reports"
  ON data_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_data_reports_zone ON data_reports(zone_slug);
CREATE INDEX idx_data_reports_status ON data_reports(status);
CREATE INDEX idx_data_reports_created ON data_reports(created_at DESC);
