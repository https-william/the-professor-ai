import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let retries = 3;
  let delay = 300; // ms
  while (retries > 0) {
    try {
      const res = await fetch(input, init);
      // Retry on common server errors or rate limits
      if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
        throw new Error(`Transient status: ${res.status}`);
      }
      return res;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2; // exponential backoff
    }
  }
  return fetch(input, init); // fallback
};

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          fetch: customFetch
        }
      }
    );
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          fetch: customFetch
        }
      }
    );
  }

  return supabaseInstance;
}
