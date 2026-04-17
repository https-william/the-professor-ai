-- Seed NPC Scholars for an active community feel
-- These scholars reflect realistic naming patterns and Nigerian cultural representation
-- Note: We must insert into auth.users first to satisfy the profiles foreign key constraint

DO $$
DECLARE
    chioma_id uuid := 'f1eeb064-9d71-45a4-927c-58e0a0c756f1';
    tobi_id uuid := 'f2eeb064-9d71-45a4-927c-58e0a0c756f2';
    mindmaster_id uuid := 'f3eeb064-9d71-45a4-927c-58e0a0c756f3';
    kunle_id uuid := 'f4eeb064-9d71-45a4-927c-58e0a0c756f4';
    astro_id uuid := 'f5eeb064-9d71-45a4-927c-58e0a0c756f5';
    nneka_id uuid := 'f6eeb064-9d71-45a4-927c-58e0a0c756f6';
    swift_id uuid := 'f7eeb064-9d71-45a4-927c-58e0a0c756f7';
    mon_date date := current_date - (extract(dow from current_date)::integer + 6) % 7; -- Start of week (Monday)
BEGIN
    -- 0. Insert into Auth Users (Minimal record for FK)
    -- We use ON CONFLICT DO NOTHING to ensure idempotency
    INSERT INTO auth.users (id, email, aud, role, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
        (chioma_id, 'chioma@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"Chioma"}'),
        (tobi_id, 'tobi@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"Tobi_King"}'),
        (mindmaster_id, 'mindmaster@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"MindMaster_99"}'),
        (kunle_id, 'kunle@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"Kunle"}'),
        (astro_id, 'astro@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"AstroScholar"}'),
        (nneka_id, 'nneka@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"Nneka"}'),
        (swift_id, 'swift@npc.study', 'authenticated', 'authenticated', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"alias":"SwiftLearner"}')
    ON CONFLICT (id) DO NOTHING;

    -- 1. Insert into Profiles
    INSERT INTO profiles (id, alias, username, xp_total, current_streak, education_level, avatar_url, has_onboarded)
    VALUES
        (chioma_id, 'Chioma', 'chioma_study', 15400, 12, 'University', '🎓', true),
        (tobi_id, 'Tobi_King', 'tobiking', 12800, 8, 'College', '🦁', true),
        (mindmaster_id, 'MindMaster_99', 'mindmaster99', 9200, 15, 'High School', '🧠', true),
        (kunle_id, 'Kunle', 'kunle_ai', 8700, 5, 'University', '💻', true),
        (astro_id, 'AstroScholar', 'astro_s', 7400, 3, 'Post-Grad', '🚀', true),
        (nneka_id, 'Nneka', 'nneka_read', 6200, 21, 'University', '📚', true),
        (swift_id, 'SwiftLearner', 'swift_l', 5100, 4, 'College', '⚡', true)
    ON CONFLICT (id) DO UPDATE SET
        xp_total = EXCLUDED.xp_total,
        current_streak = EXCLUDED.current_streak;

    -- 2. Insert Weekly Activity (to populate the weekly leaderboard)
    -- Chioma: ~250 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT chioma_id, 250, 'quiz', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- Tobi: ~180 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT tobi_id, 180, 'flashcards', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- MindMaster: ~150 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT mindmaster_id, 150, 'summary', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- Kunle: ~140 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT kunle_id, 140, 'quiz', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- AstroScholar: ~120 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT astro_id, 120, 'flashcards', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- Nneka: ~100 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT nneka_id, 100, 'summary', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

    -- SwiftLearner: ~80 XP/day
    INSERT INTO user_activity (user_id, xp_earned, activity_type, created_at)
    SELECT swift_id, 80, 'quiz', mon_date + i FROM generate_series(0, 5) i
    ON CONFLICT DO NOTHING;

END $$;
