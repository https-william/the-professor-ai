import { createClient } from '@supabase/supabase-js';

// The admin client uses the service role key to bypass RLS.
// WARNING: Never expose this client to the browser or use it for user-facing mutations without strict checks.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function createAdminClient() {
    return supabaseAdmin;
}
