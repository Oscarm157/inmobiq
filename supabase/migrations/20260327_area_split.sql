-- Split area_m2 into area_construccion_m2 + area_terreno_m2
-- area_m2 becomes a generated stored column = COALESCE(construccion, terreno)
-- All reads continue working unchanged; only writes need updating.

-- 1. Add new columns
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS area_construccion_m2 NUMERIC,
  ADD COLUMN IF NOT EXISTS area_terreno_m2 NUMERIC;

-- 2. Backfill by property type
-- Casas/deptos/oficinas/locales: current area is most likely construction
UPDATE listings SET area_construccion_m2 = area_m2
  WHERE property_type IN ('casa', 'departamento', 'oficina', 'local')
    AND area_m2 IS NOT NULL;

-- Terrenos: current area is land area
UPDATE listings SET area_terreno_m2 = area_m2
  WHERE property_type = 'terreno'
    AND area_m2 IS NOT NULL;

-- 3. Convert area_m2 to generated column
ALTER TABLE listings DROP COLUMN area_m2;
ALTER TABLE listings ADD COLUMN area_m2 NUMERIC
  GENERATED ALWAYS AS (COALESCE(area_construccion_m2, area_terreno_m2)) STORED;

-- 4. Same for valuations (Brújula)
ALTER TABLE valuations
  ADD COLUMN IF NOT EXISTS area_construccion_m2 NUMERIC,
  ADD COLUMN IF NOT EXISTS area_terreno_m2 NUMERIC;

UPDATE valuations SET area_construccion_m2 = area_m2
  WHERE property_type IN ('casa', 'departamento', 'oficina', 'local')
    AND area_m2 IS NOT NULL;

UPDATE valuations SET area_terreno_m2 = area_m2
  WHERE property_type = 'terreno'
    AND area_m2 IS NOT NULL;

ALTER TABLE valuations DROP COLUMN area_m2;
ALTER TABLE valuations ADD COLUMN area_m2 NUMERIC
  GENERATED ALWAYS AS (COALESCE(area_construccion_m2, area_terreno_m2)) STORED;
