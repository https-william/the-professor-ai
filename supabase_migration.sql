
-- 1. Backup Critical Data (Just in case)
-- CREATE TABLE IF NOT EXISTS profiles_backup_2024 AS SELECT * FROM profiles;

-- 2. Add Subscription Fields safely
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Fresher',
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly', -- 'monthly' | 'annually'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due'
ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

-- 3. Fix Gamification Counters (Ensure defaults are 0, not NULL)
UPDATE profiles SET xp = 0 WHERE xp IS NULL;
UPDATE profiles SET streak = 0 WHERE streak IS NULL;
UPDATE profiles SET daily_quizzes_generated = 0 WHERE daily_quizzes_generated IS NULL;

ALTER TABLE profiles 
ALTER COLUMN xp SET DEFAULT 0,
ALTER COLUMN streak SET DEFAULT 0,
ALTER COLUMN daily_quizzes_generated SET DEFAULT 0;

-- 4. Create RLS Policy for Admin Access (if not exists)
-- This ensures only specific emails can access admin data
CREATE POLICY "Admin Access" ON profiles
FOR ALL
USING (email IN ('popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com', 'vexis.automations@gmail.com'));

-- 5. Create Payment Log Table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC,
  reference TEXT,
  plan_code TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trigger for Auto-Provisioning (Optional, but recommended if using Webhooks directly to DB)
-- Note: Usually better handled via Edge Functions for Paystack signature verification first.
