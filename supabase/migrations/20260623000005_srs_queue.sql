CREATE TABLE IF NOT EXISTS public.srs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'card',
  pack_id UUID,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE public.srs_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own SRS items" ON public.srs_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own SRS items" ON public.srs_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own SRS items" ON public.srs_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own SRS items" ON public.srs_queue FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_srs_due ON public.srs_queue(user_id, next_review_at);
CREATE INDEX idx_srs_pack ON public.srs_queue(user_id, pack_id);
