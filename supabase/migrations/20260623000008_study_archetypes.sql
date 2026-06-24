CREATE TABLE IF NOT EXISTS public.study_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL DEFAULT 'balanced',
  velocity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  precision_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  endurance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.study_archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own archetype" ON public.study_archetypes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own archetype" ON public.study_archetypes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own archetype" ON public.study_archetypes FOR UPDATE USING (auth.uid() = user_id);
