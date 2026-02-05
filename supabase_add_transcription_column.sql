-- Migration to add 'transcription' column to 'course_lessons' table if it doesn't exist
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS transcription TEXT;
