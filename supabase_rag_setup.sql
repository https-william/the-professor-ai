-- 1. Enable Vector Extension (Required for AI Embeddings)
create extension if not exists vector;

-- 2. Create Storage Bucket for Documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- 3. Storage Policies (Security)
-- Allow public read access (so the AI can read them later easily)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'documents' );

-- Allow authenticated users to upload
create policy "Authenticated Upload"
on storage.objects for insert
with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Allow users to delete their own files
create policy "User Delete"
on storage.objects for delete
using ( bucket_id = 'documents' and auth.uid() = owner );

-- 4. Create Embeddings Table (The "Brain" Memory)
create table if not exists document_chunks (
  id bigserial primary key,
  file_path text not null,       -- Link to the storage file
  content text,                  -- The actual text snippet
  embedding vector(768),         -- 768 dim for Gemini Flash/Pro embeddings
  metadata jsonb,                -- Store page numbers, title, etc.
  created_at timestamptz default now()
);

-- 5. Create Vector Search Function
-- This allows us to find "similar" text to a user's question
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
