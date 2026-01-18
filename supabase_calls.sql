
-- ==========================================
-- THE PROFESSOR: VOIP LOGGING & METRICS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create Call Logs Table
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    receiver_alias TEXT NOT NULL, -- We store alias as PeerJS uses it for signaling
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'initiated' -- 'initiated', 'connected', 'completed', 'missed', 'rejected'
);

-- 2. Enable Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Users can view their own calls
DROP POLICY IF EXISTS "Users view own calls" ON public.call_logs;
CREATE POLICY "Users view own calls" 
ON public.call_logs FOR SELECT 
USING (auth.uid() = caller_id);

-- Users can insert call logs
DROP POLICY IF EXISTS "Users insert call logs" ON public.call_logs;
CREATE POLICY "Users insert call logs" 
ON public.call_logs FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

-- Users can update their own calls
DROP POLICY IF EXISTS "Users update own calls" ON public.call_logs;
CREATE POLICY "Users update own calls" 
ON public.call_logs FOR UPDATE 
USING (auth.uid() = caller_id);

-- ADMIN ACCESS POLICY (Required for the view below to work for admins)
DROP POLICY IF EXISTS "Admins view all calls" ON public.call_logs;
CREATE POLICY "Admins view all calls"
ON public.call_logs FOR SELECT
USING (auth.jwt() ->> 'email' IN ('popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com', 'vexis.automations@gmail.com'));

-- 4. Analytics View (For Admin Dashboard)
-- SECURITY NOTE: Added `security_invoker = true` to enforce RLS on the underlying table.
-- This prevents the "Security Definer View" warning and ensures data safety.
CREATE OR REPLACE VIEW admin_call_stats 
WITH (security_invoker = true)
AS
SELECT 
    DATE_TRUNC('day', started_at) as date,
    COUNT(*) as total_calls,
    AVG(duration_seconds) as avg_duration,
    SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_calls
FROM call_logs
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY date DESC;
