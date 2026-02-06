-- Create a new table for Mux Uploads History
CREATE TABLE IF NOT EXISTS public.mux_uploads_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Mux Identifiers
    asset_id TEXT NOT NULL,
    playback_id TEXT,
    
    -- Context (Where it was uploaded from)
    community_id TEXT, 
    course_id TEXT,
    module_id TEXT,

    -- File Metadata
    filename TEXT,
    duration NUMERIC, -- Duration in seconds
    
    -- Dates
    video_created_at TIMESTAMPTZ, -- Original video creation date
    uploaded_at TIMESTAMPTZ DEFAULT now(), -- When it was uploaded to our system
    
    -- AI/Content Data
    title TEXT,
    description TEXT,
    summary TEXT, -- corresponds to "resumen"
    transcription TEXT,
    
    -- System metadata
    user_id UUID DEFAULT auth.uid()
);

-- Documentation comments
COMMENT ON TABLE public.mux_uploads_history IS 'History of videos uploaded to Mux with their metadata, AI generated content, and module context.';
COMMENT ON COLUMN public.mux_uploads_history.module_id IS 'ID of the module where this video was uploaded from.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.mux_uploads_history ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Insert policy
CREATE POLICY "Enable insert for authenticated users" 
ON public.mux_uploads_history 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Select policy
CREATE POLICY "Enable read for authenticated users" 
ON public.mux_uploads_history 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Update policy
CREATE POLICY "Enable update for authenticated users" 
ON public.mux_uploads_history 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
