-- ==============================================================================
-- THE PROFESSOR AI — COMPREHENSIVE METRICS & ACTIVITY SCHEMA MIGRATION
-- Date: 2026-07-04
-- Purpose: Secure, atomic server-side tracking of XP, Streaks, and Study Sessions
-- ==============================================================================

-- 1. Ensure profiles table has all dopamine and progression columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date TEXT,
ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_reset_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS study_time_mins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cards_mastered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quizzes_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS summaries_read INTEGER DEFAULT 0;

-- 2. Ensure study_packs table exists and has needed columns
CREATE TABLE IF NOT EXISTS study_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    folder_id UUID,
    is_public BOOLEAN DEFAULT false,
    share_token TEXT UNIQUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS study_packs 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS folder_id UUID,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE study_packs ADD CONSTRAINT study_packs_share_token_key UNIQUE (share_token);
EXCEPTION WHEN duplicate_table THEN null;
WHEN duplicate_object THEN null;
WHEN others THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_study_packs_user_id ON study_packs(user_id);
ALTER TABLE study_packs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own study packs" ON study_packs
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Ensure generations table exists
CREATE TABLE IF NOT EXISTS generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pack_id UUID REFERENCES study_packs(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'summary', 'quiz', 'flashcards', 'roadmap', 'eli5', 'breakdown', 'match'
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS generations 
ADD COLUMN IF NOT EXISTS pack_id UUID;

DO $$ BEGIN
    ALTER TABLE generations ADD CONSTRAINT generations_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES study_packs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
WHEN others THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_pack_id ON generations(pack_id);
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own generations" ON generations
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Ensure study_sessions table exists
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pack_id UUID REFERENCES study_packs(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL, -- 'quiz', 'flashcards', 'summary_read', 'review'
    duration_seconds INTEGER DEFAULT 0,
    score INTEGER,
    total_items INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS study_sessions 
ADD COLUMN IF NOT EXISTS pack_id UUID,
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS total_items INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_pack_id ON study_sessions(pack_id);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own study sessions" ON study_sessions
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Ensure user_activity table exists
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS user_activity 
ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own activity" ON user_activity
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own activity" ON user_activity
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Atomic Server-Side RPC Function for XP and Streak Calculation
-- This prevents UI-based metric faking by executing all logic atomically in Postgres.
CREATE OR REPLACE FUNCTION record_study_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_custom_xp INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_xp_to_add INTEGER;
    v_profile RECORD;
    v_today TEXT;
    v_last_date TEXT;
    v_new_streak INTEGER;
    v_freeze_count INTEGER;
    v_freeze_used BOOLEAN := false;
    v_streak_reset BOOLEAN := false;
    v_diff_days INTEGER;
BEGIN
    -- Only allow users to modify their own stats or system admins
    IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized activity recording';
    END IF;

    -- Determine XP to award
    IF p_custom_xp IS NOT NULL THEN
        v_xp_to_add := p_custom_xp;
    ELSE
        CASE p_activity_type
            WHEN 'quiz' THEN v_xp_to_add := 50;
            WHEN 'flashcards' THEN v_xp_to_add := 30;
            WHEN 'summary' THEN v_xp_to_add := 20;
            WHEN 'roadmap' THEN v_xp_to_add := 100;
            WHEN 'daily_challenge' THEN v_xp_to_add := 25;
            WHEN 'mind-map' THEN v_xp_to_add := 35;
            WHEN 'podcast' THEN v_xp_to_add := 40;
            WHEN 'exam_sprint' THEN v_xp_to_add := 100;
            WHEN 'tour_complete' THEN v_xp_to_add := 100;
            WHEN 'trivia_duel' THEN v_xp_to_add := 50;
            ELSE v_xp_to_add := 15;
        END CASE;
    END IF;

    -- Get current date in Africa/Lagos timezone (WAT) as YYYY-MM-DD
    v_today := to_char(timezone('Africa/Lagos', now()), 'YYYY-MM-DD');

    -- Lock profile row for atomic update
    SELECT xp_total, current_streak, last_study_date, streak_freeze_count, cards_mastered, quizzes_taken, summaries_read
    INTO v_profile
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user %', p_user_id;
    END IF;

    v_new_streak := COALESCE(v_profile.current_streak, 0);
    v_freeze_count := COALESCE(v_profile.streak_freeze_count, 0);
    v_last_date := v_profile.last_study_date;

    IF v_last_date IS NULL OR v_last_date = '' THEN
        v_new_streak := 1;
    ELSE
        -- Calculate difference in days
        v_diff_days := (v_today::date - v_last_date::date);
        
        IF v_diff_days = 0 THEN
            -- Already studied today, keep current streak
        ELSIF v_diff_days = 1 THEN
            -- Consecutive day!
            v_new_streak := v_new_streak + 1;
        ELSIF v_diff_days = 2 AND v_freeze_count > 0 THEN
            -- Missed one day but have freeze
            v_new_streak := v_new_streak + 1;
            v_freeze_count := v_freeze_count - 1;
            v_freeze_used := true;
        ELSE
            -- Missed >1 day without enough freezes
            v_new_streak := 1;
            v_streak_reset := true;
        END IF;
    END IF;

    -- Update profile atomically
    UPDATE profiles
    SET xp_total = COALESCE(xp_total, 0) + v_xp_to_add,
        current_streak = v_new_streak,
        last_study_date = v_today,
        streak_freeze_count = v_freeze_count,
        cards_mastered = CASE WHEN p_activity_type = 'flashcards' THEN COALESCE(cards_mastered, 0) + 15 ELSE cards_mastered END,
        quizzes_taken = CASE WHEN p_activity_type = 'quiz' THEN COALESCE(quizzes_taken, 0) + 1 ELSE quizzes_taken END,
        summaries_read = CASE WHEN p_activity_type = 'summary' THEN COALESCE(summaries_read, 0) + 1 ELSE summaries_read END
    WHERE id = p_user_id;

    -- Insert activity log
    INSERT INTO user_activity (user_id, activity_type, xp_earned, metadata)
    VALUES (p_user_id, p_activity_type, v_xp_to_add, jsonb_build_object('streak', v_new_streak, 'freeze_used', v_freeze_used));

    RETURN jsonb_build_object(
        'xpGained', v_xp_to_add,
        'newXpTotal', COALESCE(v_profile.xp_total, 0) + v_xp_to_add,
        'newStreak', v_new_streak,
        'streakReset', v_streak_reset,
        'freezeUsed', v_freeze_used
    );
END;
$$;

GRANT EXECUTE ON FUNCTION record_study_activity(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_study_activity(UUID, TEXT, INTEGER) TO service_role;
