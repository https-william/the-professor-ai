-- Make study packs publicly readable for shared link access
CREATE POLICY "Study packs are publicly viewable"
ON public.study_packs FOR SELECT
USING (true);

