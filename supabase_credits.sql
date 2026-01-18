
-- 1. ADD CREDITS COLUMN
-- Default to 50 (Welcome Bonus) for new and existing users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;

-- 2. CREATE TRANSACTION LEDGER
-- Keeps a history of every spend and earn action
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negative for spend, Positive for gain
  type TEXT NOT NULL, -- 'GENERATION', 'PURCHASE', 'BONUS', 'SUBSCRIPTION_GRANT', 'REFUND'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SECURE LEDGER
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own history
CREATE POLICY "Users view own transactions" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. ATOMIC DEDUCTION FUNCTION (RPC)
-- This runs on the server to prevent race conditions or client-side tampering
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER, p_desc TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to bypass RLS on update if needed
AS $$
DECLARE
  current_creds INTEGER;
BEGIN
  -- Lock the user row to prevent race conditions
  SELECT credits INTO current_creds FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  IF current_creds >= p_amount THEN
    -- 1. Deduct Credits
    UPDATE public.profiles SET credits = credits - p_amount WHERE id = p_user_id;
    
    -- 2. Log Transaction
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_amount, 'GENERATION', p_desc);
    
    RETURN TRUE; -- Success
  ELSE
    RETURN FALSE; -- Insufficient Funds
  END IF;
END;
$$;

-- 5. CREDIT GRANT FUNCTION (RPC)
-- Used by Webhooks or Admin Dashboard
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER, p_type TEXT, p_desc TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET credits = credits + p_amount WHERE id = p_user_id;
  
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_desc);
END;
$$;
