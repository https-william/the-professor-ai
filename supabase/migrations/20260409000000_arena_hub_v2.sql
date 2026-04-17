-- =============================================
-- ULTRA-DEFENSIVE ARENA & LOBBY SYSTEM SETUP
-- =============================================
-- This script is designed to handle partially-failed previous migrations
-- by explicitly adding columns if they are missing before syncing types.

DO $$
DECLARE
    profile_id_type text;
BEGIN
    -- 1. DETECT PROFILE TYPE
    SELECT data_type INTO profile_id_type
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'id';

    IF profile_id_type IS NULL THEN profile_id_type := 'text'; END IF;

    -- 2. ENSURE TABLES EXIST
    CREATE TABLE IF NOT EXISTS duels (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE IF NOT EXISTS duel_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE IF NOT EXISTS lobby_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE IF NOT EXISTS room_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE IF NOT EXISTS social_stats (user_id text PRIMARY KEY); -- We fix type below

    -- 3. EXPLICITLY ADD MISSING COLUMNS (Preventing "column does not exist" errors)
    -- Duels
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS code text;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS host_id text;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS challenger_id text;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS status text DEFAULT 'WAITING';
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS generation_id uuid;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS host_score integer DEFAULT 0;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS challenger_score integer DEFAULT 0;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS host_finished_at timestamp with time zone;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS challenger_finished_at timestamp with time zone;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS winner_id text;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS time_limit_seconds integer DEFAULT 600;
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
    ALTER TABLE duels ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '1 hour');

    -- Sessions
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS duel_id uuid;
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS user_id text;
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0;
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}';
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS is_ready boolean DEFAULT false;
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS finished_at timestamp with time zone;
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS last_ping timestamp with time zone DEFAULT now();
    ALTER TABLE duel_sessions ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

    -- Lobby
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS code text;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS host_id text;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'study_group';
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS max_members integer DEFAULT 10;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS members jsonb DEFAULT '[]';
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS shared_content jsonb;
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
    ALTER TABLE lobby_rooms ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '2 hours');

    -- Messages
    ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS room_id uuid;
    ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS user_id text;
    ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS content text;
    ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
    ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

    -- Stats
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS duel_wins integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS duel_losses integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS duel_draws integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS duel_xp integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS games_played integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS highest_streak integer DEFAULT 0;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS social_level integer DEFAULT 1;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS rank_title text DEFAULT 'Novice';
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS win_rate numeric(5,2) DEFAULT 0.00;
    ALTER TABLE social_stats ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

    -- 4. SYNCHRONIZE TYPES
    IF profile_id_type = 'uuid' THEN
        ALTER TABLE duels ALTER COLUMN host_id TYPE uuid USING host_id::uuid;
        ALTER TABLE duels ALTER COLUMN challenger_id TYPE uuid USING challenger_id::uuid;
        ALTER TABLE duels ALTER COLUMN winner_id TYPE uuid USING winner_id::uuid;
        ALTER TABLE duel_sessions ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
        ALTER TABLE lobby_rooms ALTER COLUMN host_id TYPE uuid USING host_id::uuid;
        ALTER TABLE room_messages ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
        ALTER TABLE social_stats ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    ELSE
        ALTER TABLE duels ALTER COLUMN host_id TYPE text USING host_id::text;
        ALTER TABLE duels ALTER COLUMN challenger_id TYPE text USING challenger_id::text;
        ALTER TABLE duels ALTER COLUMN winner_id TYPE text USING winner_id::text;
        ALTER TABLE duel_sessions ALTER COLUMN user_id TYPE text USING user_id::text;
        ALTER TABLE lobby_rooms ALTER COLUMN host_id TYPE text USING host_id::text;
        ALTER TABLE room_messages ALTER COLUMN user_id TYPE text USING user_id::text;
        ALTER TABLE social_stats ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;

    -- 5. FINAL HARDENING
    ALTER TABLE duels ALTER COLUMN code SET NOT NULL;
    ALTER TABLE duels DROP CONSTRAINT IF EXISTS duels_code_key;
    ALTER TABLE duels ADD CONSTRAINT duels_code_key UNIQUE (code);
    ALTER TABLE duels DROP CONSTRAINT IF EXISTS duels_status_check;
    ALTER TABLE duels ADD CONSTRAINT duels_status_check CHECK (status IN ('WAITING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED'));
    
    ALTER TABLE lobby_rooms ALTER COLUMN code SET NOT NULL;
    ALTER TABLE lobby_rooms DROP CONSTRAINT IF EXISTS lobby_rooms_code_key;
    ALTER TABLE lobby_rooms ADD CONSTRAINT lobby_rooms_code_key UNIQUE (code);
    ALTER TABLE lobby_rooms DROP CONSTRAINT IF EXISTS lobby_rooms_type_check;
    ALTER TABLE lobby_rooms ADD CONSTRAINT lobby_rooms_type_check CHECK (room_type IN ('review', 'study_group', 'office_hours'));

    -- 5.5 FIX MISSING PROFILES ONBOARDING COLUMNS
    -- The onboarding PUT request and Leaderboard sends/queries these, so we need to ensure they exist on the profiles table
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level text;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_goal text;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_onboarded boolean DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_total integer DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_study_date date;

END $$;

-- 6. CONSTRAINTS (Outside DO block for standard FK handling)
ALTER TABLE duels DROP CONSTRAINT IF EXISTS fk_duels_host;
ALTER TABLE duels ADD CONSTRAINT fk_duels_host FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE duels DROP CONSTRAINT IF EXISTS fk_duels_challenger;
ALTER TABLE duels ADD CONSTRAINT fk_duels_challenger FOREIGN KEY (challenger_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE duel_sessions DROP CONSTRAINT IF EXISTS fk_duel_sessions_user;
ALTER TABLE duel_sessions ADD CONSTRAINT fk_duel_sessions_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE lobby_rooms DROP CONSTRAINT IF EXISTS fk_lobby_rooms_host;
ALTER TABLE lobby_rooms ADD CONSTRAINT fk_lobby_rooms_host FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE social_stats DROP CONSTRAINT IF EXISTS fk_social_stats_user;
ALTER TABLE social_stats ADD CONSTRAINT fk_social_stats_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. RLS
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public View Duels" ON duels;
CREATE POLICY "Public View Duels" ON duels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert Duels" ON duels;
CREATE POLICY "Insert Duels" ON duels FOR INSERT WITH CHECK (true);

-- 8. RPC (Text-based ID handling)
CREATE OR REPLACE FUNCTION update_social_stats_after_duel(p_winner_id text, p_loser_id text, p_draw boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_draw THEN
        IF p_winner_id IS NOT NULL THEN
            INSERT INTO social_stats (user_id, duel_draws, duel_xp, games_played) VALUES (p_winner_id, 1, 10, 1) ON CONFLICT (user_id) DO UPDATE SET duel_draws = social_stats.duel_draws + 1, duel_xp = social_stats.duel_xp + 10, games_played = social_stats.games_played + 1;
        END IF;
    ELSE
        IF p_winner_id IS NOT NULL THEN
            INSERT INTO social_stats (user_id, duel_wins, duel_xp, games_played) VALUES (p_winner_id, 1, 50, 1) ON CONFLICT (user_id) DO UPDATE SET duel_wins = social_stats.duel_wins + 1, duel_xp = social_stats.duel_xp + 50, games_played = social_stats.games_played + 1;
        END IF;
        IF p_loser_id IS NOT NULL THEN
            INSERT INTO social_stats (user_id, duel_losses, duel_xp, games_played) VALUES (p_loser_id, 1, 5, 1) ON CONFLICT (user_id) DO UPDATE SET duel_losses = social_stats.duel_losses + 1, duel_xp = social_stats.duel_xp + 5, games_played = social_stats.games_played + 1;
        END IF;
    END IF;
END;
$$;
