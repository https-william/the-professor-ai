-- ==============================================================================
-- Audit Logs Table Migration
-- Purpose: To track user access to documents and satisfy data audit requirements.
-- ==============================================================================

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL, -- e.g., 'DOCUMENT_READ', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE'
    resource_id VARCHAR(255) NOT NULL, -- The ID or name of the document/resource accessed
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (e.g., IP address, user agent)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users should never be able to read or modify the audit logs directly.
-- Only the backend Service Role can insert and read from this table.

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny public access to audit logs" ON public.audit_logs;

-- Allow insert via service role only
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow select via service role only
CREATE POLICY "Service role can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Explicitly deny all access to authenticated and anonymous users
CREATE POLICY "Deny public access to audit logs"
    ON public.audit_logs
    FOR ALL
    TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- 4. Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
