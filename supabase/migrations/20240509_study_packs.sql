    -- Study Packs Table
    -- Stores aggregated scholarly journeys (Survival Kits)
    CREATE TABLE IF NOT EXISTS public.study_packs (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        source_text TEXT,
        
        -- JSONB to store phase content and progress
        -- { "distill": { "status": "completed", "content": "..." }, "retain": { ... } }
        phases_data JSONB DEFAULT '{}'::jsonb,
        
        -- Overall performance metrics after completing the journey
        performance_summary JSONB,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- RLS Policies
    ALTER TABLE public.study_packs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own study packs" 
    ON public.study_packs FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own study packs" 
    ON public.study_packs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own study packs" 
    ON public.study_packs FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own study packs" 
    ON public.study_packs FOR DELETE 
    USING (auth.uid() = user_id);

    -- Updated at trigger
    CREATE OR REPLACE FUNCTION update_study_packs_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_study_packs_updated_at_trigger
        BEFORE UPDATE ON public.study_packs
        FOR EACH ROW
        EXECUTE PROCEDURE update_study_packs_updated_at();
