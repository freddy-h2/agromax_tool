-- =============================================
-- Table: media
-- Description: Stores video metadata for MUX streaming integration
-- =============================================

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Inputs
    title TEXT NOT NULL,
    description TEXT,
    resumen TEXT,
    live_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Mux Integration (Critical but Optional for testing)
    mux_playback_id TEXT,
    livestream_config_id TEXT, -- Optional
    
    -- Admin / Mux Credentials (New)
    -- Admin / Mux Credentials
    -- token_id and secret_key removed in favor of server-side env vars
    mux_asset_id TEXT,
    
    -- AI Content
    transcription TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_mux_playback_id ON media(mux_playback_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_media_updated_at_trigger ON media;
CREATE TRIGGER update_media_updated_at_trigger
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- RLS Policies
-- For local development/testing, we DISABLE RLS to avoid permission issues
ALTER TABLE media DISABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow all users to select media"
    ON media FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow insert access to all users (for testing)
CREATE POLICY "Allow all users to insert media"
    ON media FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow update access to all users
CREATE POLICY "Allow all users to update media"
    ON media FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete access to all users
CREATE POLICY "Allow all users to delete media"
    ON media FOR DELETE
    TO anon, authenticated
    USING (true);
