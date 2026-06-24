-- Allow public select reads on generations table to enable guest access via shared links
CREATE POLICY "Generations are viewable by anyone with the link"
ON public.generations FOR SELECT
USING (true);
