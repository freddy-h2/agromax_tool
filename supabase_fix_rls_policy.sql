-- Create a policy to allow UPDATE for authenticated users
-- This is required for UPSERT operations to work correctly when a row already exists.
CREATE POLICY "Enable update for authenticated users"
ON public.video_processing_results
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
