-- Add user-customizable default filters and registration metadata
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS default_operacion TEXT DEFAULT NULL
    CHECK (default_operacion IN ('venta', 'renta')),
  ADD COLUMN IF NOT EXISTS default_categoria TEXT DEFAULT NULL
    CHECK (default_categoria IN ('residencial', 'comercial', 'terreno')),
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT NULL
    CHECK (referral_source IN ('google', 'redes_sociales', 'recomendacion', 'otro'));

-- Update trigger to capture phone and referral_source from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, phone, referral_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'referral_source'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
