CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID,
  surface TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  cards_flipped INTEGER DEFAULT 0,
  chapters_read INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_sessions_user_surface ON public.study_sessions(user_id, surface);
CREATE INDEX idx_sessions_started ON public.study_sessions(started_at DESC);
