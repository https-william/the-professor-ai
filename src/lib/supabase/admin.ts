import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

// The admin client uses the service role key to bypass RLS.
// WARNING: Never expose this client to the browser or use it for user-facing mutations without strict checks.
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Creates/returns a server-side Supabase client using the Service Role Key.
 * This client BYPASSES Row Level Security (RLS). Use ONLY in secure server routes.
 */
export function createAdminClient() {
    return supabaseAdmin;
}
