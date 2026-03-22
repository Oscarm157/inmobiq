-- Migration: Admin role + scrape_jobs table
-- Date: 2026-03-22

-- 1. Add role column to user_profiles
ALTER TABLE user_profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Set Oscar as admin
UPDATE user_profiles SET role = 'admin' WHERE email = 'oscar.amayoral@gmail.com';

-- 2. Add 'otro' to source_portal enum
ALTER TYPE source_portal ADD VALUE IF NOT EXISTS 'otro';

-- 3. Create scrape_jobs table for manual scrape tracking
CREATE TABLE scrape_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','scraping','extracting','preview','saved','failed')),
  extracted_data JSONB,
  normalized_data JSONB,
  listing_id UUID REFERENCES listings(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only admins can access scrape_jobs
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scrape_jobs" ON scrape_jobs FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Index for querying history
CREATE INDEX idx_scrape_jobs_user_id ON scrape_jobs(user_id);
CREATE INDEX idx_scrape_jobs_created_at ON scrape_jobs(created_at DESC);

-- Rollback:
-- DROP POLICY "Admins manage scrape_jobs" ON scrape_jobs;
-- DROP TABLE scrape_jobs;
-- ALTER TABLE user_profiles DROP COLUMN role;
-- (Cannot remove enum value in Postgres without recreating the type)
