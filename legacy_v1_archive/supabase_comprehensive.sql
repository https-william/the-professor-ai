
-- ==========================================
-- THE PROFESSOR: COMPREHENSIVE DB SETUP
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. HUBS & MESSAGING (Fixes "public.hub_messages does not exist")
CREATE TABLE IF NOT EXISTS public.hubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    host TEXT NOT NULL,
    participants TEXT[] DEFAULT '{}',
    modules JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hub_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HISTORY & FLASHCARDS STORAGE
-- Replaces localStorage for history items
CREATE TABLE IF NOT EXISTS public.history (
    id TEXT PRIMARY KEY, -- Using TEXT to match frontend ID generation (Date.now().toString())
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL, -- 'EXAM', 'PROFESSOR', 'CHAT', 'FLASHCARDS'
    title TEXT,
    data JSONB NOT NULL, -- Stores QuizState, ProfessorState, etc.
    summary TEXT,
    config JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES

-- Hubs
CREATE POLICY "Hubs viewable by everyone" ON public.hubs FOR SELECT USING (true);
CREATE POLICY "Auth users create hubs" ON public.hubs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users join hubs" ON public.hubs FOR UPDATE USING (auth.role() = 'authenticated');

-- Hub Messages
CREATE POLICY "Messages viewable by everyone in hub" ON public.hub_messages FOR SELECT USING (true);
CREATE POLICY "Auth users send messages" ON public.hub_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- History
CREATE POLICY "Users view own history" ON public.history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own history" ON public.history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own history" ON public.history FOR DELETE USING (auth.uid() = user_id);

-- 5. DUEL TABLES (Ensure existence)
CREATE TABLE IF NOT EXISTS public.duels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE,
    host_id TEXT,
    participants JSONB,
    wager INTEGER,
    content TEXT,
    quiz_config JSONB,
    quiz_questions JSONB,
    status TEXT,
    winner_id TEXT,
    sudden_death_question JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duels public access" ON public.duels FOR ALL USING (true);
