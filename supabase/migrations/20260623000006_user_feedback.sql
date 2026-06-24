CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID,
  surface TEXT NOT NULL,
  feedback_type TEXT NOT NULL DEFAULT 'thumbs',
  rating INTEGER,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_feedback_user ON public.user_feedback(user_id);
CREATE INDEX idx_feedback_type ON public.user_feedback(feedback_type);
