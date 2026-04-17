-- SQL to create the blog_posts table for dynamic CMS functionality
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time_minutes INTEGER DEFAULT 5,
  featured_image TEXT,
  target_user_id UUID REFERENCES auth.users(id), -- If a post should be authored by someone
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published blogs
CREATE POLICY "Public blog posts are viewable by all"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- Admins can do all (for now everyone can insert for test purposes)
CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  USING (true);

-- Trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_timestamp
BEFORE UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
