-- Enable Row Level Security
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own document chunks
CREATE POLICY "Users can insert their own document chunks" ON public.document_chunks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view/manage their own document chunks
CREATE POLICY "Users can view and manage their own chunks" ON public.document_chunks
FOR ALL USING (auth.uid() = user_id);
