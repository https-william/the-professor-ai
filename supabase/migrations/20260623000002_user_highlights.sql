CREATE TABLE IF NOT EXISTS public.user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL,
  section_id TEXT,
  surface TEXT NOT NULL DEFAULT 'summary',
  highlighted_text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'amber',
  note TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own highlights" ON public.user_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own highlights" ON public.user_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON public.user_highlights FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_highlights_user_pack ON public.user_highlights(user_id, pack_id);
