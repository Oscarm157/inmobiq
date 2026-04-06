-- Internal analytics: lightweight event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  event_type  TEXT NOT NULL,       -- 'pageview', 'feature', 'export', 'brujula', 'search'
  event_name  TEXT NOT NULL,       -- page path or feature name
  metadata    JSONB DEFAULT '{}',  -- extra context (filters used, zone, duration_ms, etc.)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes for admin queries
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous + authenticated)
CREATE POLICY "Anyone can insert events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read events"
  ON analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Auto-cleanup: delete events older than 90 days (run as cron or manually)
-- DELETE FROM analytics_events WHERE created_at < now() - interval '90 days';
