-- Fix 3: Clean up outliers and bad data in listings table
-- Run against Supabase database

BEGIN;

-- 1. Deactivate listings with area_m2 = 0 (for houses/apartments that should have area)
UPDATE listings
SET is_active = false
WHERE area_m2 = 0
  AND property_type IN ('casa', 'departamento')
  AND is_active = true;

-- 2. Deactivate listings with unreasonably large area (> 50,000 m²)
UPDATE listings
SET is_active = false
WHERE area_m2 > 50000
  AND is_active = true;

-- 3. Deactivate listings with unreasonably small area for houses/apartments (< 10 m²)
UPDATE listings
SET is_active = false
WHERE area_m2 < 10
  AND area_m2 > 0
  AND property_type IN ('casa', 'departamento')
  AND is_active = true;

-- 4. Fix HTML entities in titles
UPDATE listings
SET title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  title,
  '&sup2;', '²'),
  '&amp;', '&'),
  '&lt;', '<'),
  '&gt;', '>'),
  '&quot;', '"')
WHERE title LIKE '%&%'
  AND (title LIKE '%&sup2;%' OR title LIKE '%&amp;%' OR title LIKE '%&lt;%' OR title LIKE '%&gt;%' OR title LIKE '%&quot;%');

-- 5. Fix misclassified listings: "Renta" in title but listing_type = 'venta'
-- (Only fix obvious cases where title clearly says "en renta")
UPDATE listings
SET listing_type = 'renta'
WHERE LOWER(title) LIKE '%en renta%'
  AND listing_type = 'venta'
  AND is_active = true;

COMMIT;
