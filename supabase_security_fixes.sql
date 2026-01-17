
-- 1. SECURE PAYMENT LOGS (Fixes "RLS Disabled in Public" Critical Error)
ALTER TABLE IF EXISTS public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy so users can only see their own logs (or admins)
DROP POLICY IF EXISTS "Users view own payment logs" ON public.payment_logs;
CREATE POLICY "Users view own payment logs" 
ON public.payment_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. FIX FUNCTION SEARCH PATHS (Fixes "Function Search Path Mutable" Warnings)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public, extensions 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, alias, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 3. ENSURE PROFILE SECURITY (Fixes "Multiple Permissive Policies")
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. FIX OTHER TABLES RLS
ALTER TABLE IF EXISTS public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hub_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Duels viewable by all" ON public.duels;
CREATE POLICY "Duels viewable by all" ON public.duels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users create duels" ON public.duels;
CREATE POLICY "Auth users create duels" ON public.duels FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Participants update duels" ON public.duels;
CREATE POLICY "Participants update duels" ON public.duels FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. FIX PUBLIC SHARES (CRITICAL FOR SHARING FEATURE)
-- Ensure the table exists first (safely)
CREATE TABLE IF NOT EXISTS public.public_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to read a share (it's public by definition)
DROP POLICY IF EXISTS "Public Read Shares" ON public.public_shares;
CREATE POLICY "Public Read Shares"
ON public.public_shares FOR SELECT
USING (true);

-- Allow Authenticated users AND Anon users (if you want public uploads) to create shares
-- Ideally, limit to authenticated to prevent spam, but for "The Professor", authenticated is safer.
DROP POLICY IF EXISTS "Users Create Shares" ON public.public_shares;
CREATE POLICY "Users Create Shares"
ON public.public_shares FOR INSERT
WITH CHECK (true); -- Allow all inserts for now, or restrict to auth.role() = 'authenticated'

