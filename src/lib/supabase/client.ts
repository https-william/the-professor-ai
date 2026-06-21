import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

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
    } finally {
      clearTimeout(timeoutId);
      if (init?.signal) {
        init.signal.removeEventListener('abort', onAbort);
      }
    }
  }
  return fetch(input, init); // fallback
};

const REAL_SUPABASE_URL = 'https://hzdjctvkrsmtjqhndckk.supabase.co';
const REAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZGpjdHZrcnNtdGpxaG5kY2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDUxNzcsImV4cCI6MjA4MzM4MTE3N30.p-9JcWoljflIo0qF401eTz_NKGFxxhULuxhtl8_NEcw';

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || REAL_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || REAL_SUPABASE_ANON_KEY;

  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    supabaseUrl = REAL_SUPABASE_URL;
    supabaseAnonKey = REAL_SUPABASE_ANON_KEY;
  }

  if (typeof window === 'undefined') {
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          fetch: customFetch
        }
      }
    );
  }

  if (!supabaseInstance) {
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
