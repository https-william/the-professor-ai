-- ==============================================================================
-- THE PROFESSOR AI — IDEMPOTENT COLUMN REPAIR & SCHEMA SYNCHRONIZATION
-- Date: 2026-07-05
-- Purpose: Fixes ERROR: 42703 (column "pack_id" does not exist) by explicitly
-- adding missing columns to tables that already existed prior to recent schema upgrades.
-- ==============================================================================

-- 1. Ensure study_packs has all required columns
ALTER TABLE IF EXISTS study_packs 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS folder_id UUID,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phases_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS source_text TEXT,
ADD COLUMN IF NOT EXISTS performance_summary JSONB;

DO $$ BEGIN
    ALTER TABLE study_packs ADD CONSTRAINT study_packs_share_token_key UNIQUE (share_token);
EXCEPTION WHEN duplicate_table THEN null;
WHEN duplicate_object THEN null;
WHEN others THEN null;
END $$;

-- 2. Ensure generations has pack_id and all required columns
ALTER TABLE IF EXISTS generations 
ADD COLUMN IF NOT EXISTS pack_id UUID,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS type TEXT;

DO $$ BEGIN
    ALTER TABLE generations ADD CONSTRAINT generations_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES study_packs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
WHEN others THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_generations_pack_id ON generations(pack_id);

-- 3. Ensure study_sessions has pack_id and all metrics columns
ALTER TABLE IF EXISTS study_sessions 
ADD COLUMN IF NOT EXISTS pack_id UUID,
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS total_items INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cards_flipped INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chapters_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_pack_id ON study_sessions(pack_id);

-- 4. Ensure SRS queue and user interactive tables have pack_id
ALTER TABLE IF EXISTS srs_queue ADD COLUMN IF NOT EXISTS pack_id UUID;
CREATE INDEX IF NOT EXISTS idx_srs_pack ON srs_queue(user_id, pack_id);

ALTER TABLE IF EXISTS user_highlights ADD COLUMN IF NOT EXISTS pack_id UUID;
CREATE INDEX IF NOT EXISTS idx_highlights_user_pack ON user_highlights(user_id, pack_id);

ALTER TABLE IF EXISTS user_bookmarks ADD COLUMN IF NOT EXISTS pack_id UUID;
ALTER TABLE IF EXISTS user_feedback ADD COLUMN IF NOT EXISTS pack_id UUID;
ALTER TABLE IF EXISTS feature_usage_events ADD COLUMN IF NOT EXISTS pack_id UUID;

-- 5. Ensure user_activity has required columns
ALTER TABLE IF EXISTS user_activity 
ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
