-- Create a new table to store processed video content
-- This table creates a record of the AI processing results and metadata

CREATE TABLE IF NOT EXISTS public.video_processing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metadata from the original video (External reference)
    video_id UUID NOT NULL, -- ID from the source system (Project B)
    video_title TEXT,
    video_description TEXT,
    video_created_at TIMESTAMPTZ,
    duration_minutes NUMERIC,

    -- Context hierarchy
    community_name TEXT,
    course_title TEXT,
    module_title TEXT,

    -- AI Generated Content
    ai_summary TEXT,      -- The generated summary
    transcription TEXT,   -- The full transcription

    -- System timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.video_processing_results IS 'Stores the output of AI video processing including transcription and summaries.';
COMMENT ON COLUMN public.video_processing_results.video_id IS 'Reference ID to the original video in the source database.';

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.video_processing_results ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- 1. Permitir INSERT a cualquier usuario autenticado
CREATE POLICY "Enable insert for authenticated users only" 
ON public.video_processing_results
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Permitir SELECT a cualquier usuario autenticado (para poder ver lo guardado)
CREATE POLICY "Enable read access for authenticated users" 
ON public.video_processing_results
FOR SELECT 
TO authenticated 
USING (true);
