-- Add is_active and last_sign_in to user_profiles for admin management
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Index for admin listing
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Allow admins to read all user profiles (for user management)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Allow admins to update any profile (toggle active, change role)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- View to get user activity stats (valuations count, exports count, last activity)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  up.id,
  up.email,
  up.full_name,
  up.avatar_url,
  up.role,
  up.perfil,
  up.is_active,
  up.created_at,
  up.last_sign_in_at,
  COALESCE(v.valuation_count, 0) AS valuation_count,
  v.last_valuation_at
FROM user_profiles up
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS valuation_count,
    MAX(created_at) AS last_valuation_at
  FROM valuations
  WHERE status = 'completed'
  GROUP BY user_id
) v ON v.user_id = up.id;
