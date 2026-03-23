-- Migration: Add preference columns to user_profiles
-- Stores user's preferred category and operation mode.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferred_categoria TEXT DEFAULT 'residencial'
    CHECK (preferred_categoria IN ('residencial', 'comercial', 'terreno')),
  ADD COLUMN IF NOT EXISTS preferred_operacion TEXT DEFAULT 'venta'
    CHECK (preferred_operacion IN ('venta', 'renta'));
