-- Create user_activity table for discrete XP logging to support Weekly Leaderboards
CREATE TABLE IF NOT EXISTS user_activity (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    xp_earned integer NOT NULL,
    activity_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance (Weekly aggregate is time-heavy)
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity (created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity (user_id);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Governance: Rankings need to be public for the leaderboard to work
CREATE POLICY "Activity is publicly readable for leaderboard" 
ON user_activity FOR SELECT 
USING (true);

-- Users can only record their own activity
CREATE POLICY "Users can insert their own activity" 
ON user_activity FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Metadata for Migration Tracking
COMMENT ON TABLE user_activity IS 'Logs every XP gain event for weekly engagement tracking and authentic rankings.';
