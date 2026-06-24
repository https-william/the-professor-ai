CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL,
  surface TEXT NOT NULL DEFAULT 'summary',
  position_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pack_id, surface)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own bookmarks" ON public.user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own bookmarks" ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON public.user_bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_bookmarks_user ON public.user_bookmarks(user_id);
