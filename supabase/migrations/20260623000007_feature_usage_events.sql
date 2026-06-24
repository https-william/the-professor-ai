CREATE TABLE IF NOT EXISTS public.feature_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  surface TEXT,
  pack_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON public.feature_usage_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all events" ON public.feature_usage_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE INDEX idx_events_user ON public.feature_usage_events(user_id, created_at DESC);
CREATE INDEX idx_events_type ON public.feature_usage_events(event_type);
CREATE INDEX idx_events_surface ON public.feature_usage_events(surface);
