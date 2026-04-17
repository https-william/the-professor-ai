-- SQL to create the broadcasts table for real-time notifications
CREATE TABLE broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'broadcast',
  icon TEXT DEFAULT 'campaign',
  link TEXT,
  target_user_id UUID REFERENCES auth.users(id), -- NULL means broadcast to everyone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Read-only for all by default, admins can write)
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Everyone can read broadcasts (either global ones, or targeted to them)
CREATE POLICY "Public broadcasts are viewable by all"
  ON broadcasts FOR SELECT
  USING (target_user_id IS NULL OR target_user_id = auth.uid());

-- Only admins can insert (simplified here, but assuming you have a way to check admins)
-- Currently allowing all for testing purposes. Please secure this in production.
CREATE POLICY "Admins can insert broadcasts"
  ON broadcasts FOR ALL
  USING (true);

-- Enable Realtime!
-- NOTE: In Supabase dashboard, you may also need to manually go to Database -> Replication -> supabase_realtime -> turn on for 'broadcasts'
ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
