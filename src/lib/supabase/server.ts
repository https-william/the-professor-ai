import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let retries = 3;
  let delay = 300; // ms
  while (retries > 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout is safer for slow networks/auth

    const onAbort = () => controller.abort();
    if (init?.signal) {
      if (init.signal.aborted) {
        controller.abort();
      } else {
        init.signal.addEventListener('abort', onAbort);
      }
    }

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      
      if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
        throw new Error(`Transient status: ${res.status}`);
      }
      return res;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    } finally {
      clearTimeout(timeoutId);
      if (init?.signal) {
        init.signal.removeEventListener('abort', onAbort);
      }
    }
  }
  return fetch(input, init);
};

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  try {
    const cookieStore = await cookies()
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        global: {
          headers: authHeader ? { Authorization: authHeader } : undefined,
          fetch: customFetch
        },
      }
    )
  } catch (e) {
    // We are in a static build phase (Next.js output: export)
    // Return a dummy client to prevent build bailout.
    console.log("Static Build Detected: Shielding Supabase Client");
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() { return [] },
          setAll(cookiesToSet: any[]) { },
        },
        global: {
          fetch: customFetch
        }
      }
    )
  }
}
