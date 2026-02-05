-- Add a unique constraint to video_id to allow UPSERT operations
ALTER TABLE public.video_processing_results
ADD CONSTRAINT video_processing_results_video_id_key UNIQUE (video_id);
