
-- 1. Create Storage Bucket for Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- 2. Enable Row Level Security
alter table storage.objects enable row level security;

-- 3. Policy: Allow Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 4. Policy: Allow Authenticated Users to Upload
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- 5. Policy: Allow Users to Update their own files
create policy "User Update"
on storage.objects for update
using (
  bucket_id = 'avatars' 
  and auth.uid() = owner
);

-- 6. Policy: Allow Users to Delete their own files
create policy "User Delete"
on storage.objects for delete
using (
  bucket_id = 'avatars' 
  and auth.uid() = owner
);
