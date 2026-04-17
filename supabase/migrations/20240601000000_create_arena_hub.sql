-- =============================================
-- MIGRATION 1: DUELS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS duels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    host_id uuid NOT NULL,
    challenger_id uuid,
    status text NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
    generation_id uuid,
    host_score integer DEFAULT 0,
    challenger_score integer DEFAULT 0,
    host_finished_at timestamp with time zone,
    challenger_finished_at timestamp with time zone,
    winner_id uuid,
    time_limit_seconds integer DEFAULT 600,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone DEFAULT (timezone('utc'::text, now()) + interval '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_duels_code ON duels (code);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels (status);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their duels" ON duels FOR SELECT USING (true);
CREATE POLICY "Users can create duels" ON duels FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update duels" ON duels FOR UPDATE USING (true);

-- =============================================
-- MIGRATION 2: DUEL SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS duel_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    duel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    current_question_index integer DEFAULT 0,
    answers jsonb DEFAULT '{}',
    is_ready boolean DEFAULT false,
    finished_at timestamp with time zone,
    last_ping timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(duel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_duel_sessions_duel_id ON duel_sessions (duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_sessions_user_id ON duel_sessions (user_id);

ALTER TABLE duel_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions visible to all" ON duel_sessions FOR SELECT USING (true);
CREATE POLICY "Sessions updateable by all" ON duel_sessions FOR UPDATE USING (true);
CREATE POLICY "Sessions insertable by all" ON duel_sessions FOR INSERT WITH CHECK (true);

-- =============================================
-- MIGRATION 3: LOBBY ROOMS
-- =============================================

CREATE TABLE IF NOT EXISTS lobby_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    host_id uuid NOT NULL,
    name text NOT NULL,
    room_type text NOT NULL DEFAULT 'study_group' CHECK (room_type IN ('review', 'study_group', 'office_hours')),
    description text,
    is_public boolean DEFAULT true,
    max_members integer DEFAULT 10,
    members jsonb DEFAULT '[]',
    shared_content jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone DEFAULT (timezone('utc'::text, now()) + interval '2 hours')
);

CREATE INDEX IF NOT EXISTS idx_lobby_rooms_code ON lobby_rooms (code);

ALTER TABLE lobby_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms visible to all" ON lobby_rooms FOR SELECT USING (true);
CREATE POLICY "Rooms creatable by all" ON lobby_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Rooms updateable by all" ON lobby_rooms FOR UPDATE USING (true);

-- =============================================
-- MIGRATION 4: ROOM MESSAGES
-- =============================================

CREATE TABLE IF NOT EXISTS room_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    message_type text DEFAULT 'text',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages visible to all" ON room_messages FOR SELECT USING (true);
CREATE POLICY "Messages insertable by all" ON room_messages FOR INSERT WITH CHECK (true);

-- =============================================
-- MIGRATION 5: SOCIAL STATS
-- =============================================

CREATE TABLE IF NOT EXISTS social_stats (
    user_id uuid PRIMARY KEY,
    duel_wins integer DEFAULT 0,
    duel_losses integer DEFAULT 0,
    duel_draws integer DEFAULT 0,
    duel_xp integer DEFAULT 0,
    games_played integer DEFAULT 0,
    highest_streak integer DEFAULT 0,
    social_level integer DEFAULT 1,
    rank_title text DEFAULT 'Novice',
    win_rate numeric(5,2) DEFAULT 0.00,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE social_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social stats visible to all" ON social_stats FOR SELECT USING (true);
CREATE POLICY "Social stats updateable by all" ON social_stats FOR UPDATE USING (true);

-- Create social_stats for existing users
INSERT INTO social_stats (user_id) 
SELECT id FROM profiles 
WHERE NOT EXISTS (SELECT 1 FROM social_stats WHERE social_stats.user_id = profiles.id) 
ON CONFLICT DO NOTHING;

SELECT 'All migrations completed successfully!' as status;
