-- ============================================
-- GENERATIONS TABLE FOR LIBRARY PERSISTENCE
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create the generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('flashcards', 'quiz', 'summary', 'mindmap', 'podcast')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can only view their own generations
CREATE POLICY "Users can view own generations"
  ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own generations
CREATE POLICY "Users can insert own generations"
  ON generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete own generations"
  ON generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Grant permissions (optional, RLS handles security)
GRANT SELECT, INSERT, DELETE ON generations TO authenticated;
