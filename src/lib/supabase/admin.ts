import { createClient } from '@supabase/supabase-js';

/**
 * Creates an admin Supabase client using the service role key.
 * This client bypasses Row Level Security (RLS) and should only be used
 * in secure server-side contexts like webhooks or internal APIs.
 * 
 * SECURITY WARNING: Never expose this client to client-side code!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
