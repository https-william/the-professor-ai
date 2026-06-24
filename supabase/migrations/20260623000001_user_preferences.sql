CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_preset TEXT NOT NULL DEFAULT 'midnight-scholar',
  font_size INTEGER NOT NULL DEFAULT 16,
  line_height NUMERIC(3,1) NOT NULL DEFAULT 1.6,
  dyslexia_mode BOOLEAN NOT NULL DEFAULT false,
  bionic_reading BOOLEAN NOT NULL DEFAULT false,
  audio_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'en',
  study_goal_hours_weekly INTEGER NOT NULL DEFAULT 10,
  notification_prefs JSONB NOT NULL DEFAULT '{"email_reminders": true, "streak_alerts": true, "weekly_wrapped": true, "study_breaks": true}'::jsonb,
  low_bandwidth_mode BOOLEAN NOT NULL DEFAULT false,
  zen_focus_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
