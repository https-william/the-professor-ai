
-- Create generations table
create table if not exists generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('flashcards', 'quiz', 'summary', 'mindmap', 'podcast')),
  title text,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table generations enable row level security;

-- Policy: Users can view their own generations
create policy "Users can view own generations"
  on generations for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own generations
create policy "Users can insert own generations"
  on generations for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own generations
create policy "Users can delete own generations"
  on generations for delete
  using (auth.uid() = user_id);
