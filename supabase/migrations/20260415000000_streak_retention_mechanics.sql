-- Add Streak Freeze and Recovery fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_reset_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN profiles.streak_freeze_count IS 'Number of banked streak freezes.';
COMMENT ON COLUMN profiles.last_streak IS 'The streak value before it was last reset, allowing for recovery.';
COMMENT ON COLUMN profiles.streak_reset_at IS 'Timestamp of the last streak reset, used for 24h recovery window.';
