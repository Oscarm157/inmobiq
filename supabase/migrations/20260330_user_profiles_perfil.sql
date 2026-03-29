-- Add user profile type for personalized experience
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT NULL
    CHECK (perfil IN ('comprador', 'vendedor', 'arrendador', 'broker'));
