-- Brújula: Property valuation module
-- Allows users to upload screenshots or enter data manually,
-- then compares the property against zone-level market data.

CREATE TABLE valuations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- nullable for anonymous free valuation

  -- Flow tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','extracting','preview','completed','failed')),
  input_mode TEXT NOT NULL DEFAULT 'screenshots'
    CHECK (input_mode IN ('screenshots','manual')),

  -- Screenshot storage (Supabase Storage paths)
  screenshot_paths TEXT[] NOT NULL DEFAULT '{}',

  -- AI-extracted data (raw Claude Vision response)
  extracted_data JSONB,

  -- Confirmed property data (user-reviewed)
  property_type TEXT CHECK (property_type IN ('casa','departamento','terreno','local','oficina')),
  listing_type TEXT CHECK (listing_type IN ('venta','renta')),
  price_mxn NUMERIC,
  area_m2 NUMERIC,
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  parking SMALLINT,
  address TEXT,

  -- Zone assignment
  zone_id UUID REFERENCES zones(id),
  zone_slug TEXT,
  zone_assignment_method TEXT
    CHECK (zone_assignment_method IN ('colonia','title','polygon','nearest','manual','none')),

  -- Valuation results
  valuation_result JSONB,
  verdict TEXT CHECK (verdict IN ('muy_barata','barata','precio_justo','cara','muy_cara')),
  score NUMERIC,
  narrative TEXT,

  -- AI usage tracking
  ai_model TEXT,
  ai_input_tokens INTEGER DEFAULT 0,
  ai_output_tokens INTEGER DEFAULT 0,

  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access to own rows
CREATE POLICY "Users manage own valuations" ON valuations FOR ALL
  USING (auth.uid() = user_id);

-- Anonymous valuations: accessible via service role only (API handles access control)
CREATE POLICY "Service role full access" ON valuations FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_valuations_user_id ON valuations(user_id);
CREATE INDEX idx_valuations_created_at ON valuations(created_at DESC);
CREATE INDEX idx_valuations_zone_id ON valuations(zone_id);
CREATE INDEX idx_valuations_status ON valuations(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_valuations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_valuations_updated_at();
