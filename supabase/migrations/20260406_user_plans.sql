-- User subscription plans
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'business'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);
