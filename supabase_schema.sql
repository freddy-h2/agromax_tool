-- =============================================
-- Supabase PostgreSQL Schema
-- SaaS-lite Video Manager Application
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: published_videos
-- Description: Stores published video metadata for MUX streaming
-- =============================================
CREATE TABLE IF NOT EXISTS published_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Video Information
    title TEXT NOT NULL,
    description TEXT,
    resumen TEXT,
    descripcion TEXT,
    
    -- Scheduling
    live_date TIMESTAMP WITH TIME ZONE,
    duration_minutes REAL,
    
    -- MUX Integration
    mux_playback_id TEXT,
    livestream_config_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_published_videos_live_date ON published_videos(live_date);
CREATE INDEX IF NOT EXISTS idx_published_videos_mux_playback_id ON published_videos(mux_playback_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to published_videos table
DROP TRIGGER IF EXISTS update_published_videos_updated_at ON published_videos;
CREATE TRIGGER update_published_videos_updated_at
    BEFORE UPDATE ON published_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE published_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all videos
CREATE POLICY "Allow authenticated users to read videos"
    ON published_videos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert videos
CREATE POLICY "Allow authenticated users to insert videos"
    ON published_videos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update videos
CREATE POLICY "Allow authenticated users to update videos"
    ON published_videos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete videos
CREATE POLICY "Allow authenticated users to delete videos"
    ON published_videos
    FOR DELETE
    TO authenticated
    USING (true);
