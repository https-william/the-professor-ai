
-- ==========================================
-- THE PROFESSOR: LEGACY MIGRATION SCRIPT
-- RUN THIS ONCE IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Identify users who existed BEFORE the migration date (e.g., today)
-- We assume anyone with 0 credits might be a pre-existing user if you ran the default migration already
-- Or strictly filter by created_at if reliable.

-- Let's grant 500 "Legacy Credits" to all existing users as a goodwill gesture.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles WHERE credits < 100 LOOP
        -- Call the add_credits RPC to ensure ledger consistency
        -- This mimics the "Legacy Bonus" transaction
        PERFORM add_credits(
            r.id, 
            500, 
            'BONUS', 
            'Legacy User Appreciation Gift'
        );
    END LOOP;
END $$;

-- 2. RESET DEFAULT FOR NEW USERS
-- Ensure the default in schema is 50, but we want 500 for old users.
-- Check if migration was applied:
-- ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 50;

-- 3. VERIFICATION
-- SELECT id, email, credits FROM public.profiles ORDER BY credits DESC LIMIT 10;
