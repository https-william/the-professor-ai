-- Update profiles table with social and stats columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 10),
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- Function to handle username safety (optional, but good for UX)
-- For now, we'll handle validation in the API and Onboarding UI.
