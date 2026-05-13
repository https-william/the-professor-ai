-- Add notification and study preference columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS difficulty_preference TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';

-- Comment on columns for clarity
COMMENT ON COLUMN profiles.notification_email IS 'Whether the user wants daily streak and study reminders via email';
COMMENT ON COLUMN profiles.notification_push IS 'Whether the user wants browser/mobile push notifications';
COMMENT ON COLUMN profiles.daily_goal_minutes IS 'User target for daily study time in minutes';
COMMENT ON COLUMN profiles.difficulty_preference IS 'Preferred difficulty level for generated content (easy, medium, hard)';
