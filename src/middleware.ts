import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/onboarding', '/api/user', '/settings'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  // Auth pages that logged-in users should be redirected AWAY from
  const authPaths = ['/', '/login', '/signup'];
  const isAuthPage = authPaths.includes(pathname);

  // We only run getUser() if we are either accessing a protected route or if we have a Supabase auth token cookie (returning user)
  const hasAuthCookie = request.cookies.getAll().some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  if (isProtected || (isAuthPage && hasAuthCookie)) {
    const { data: { user } } = await supabase.auth.getUser();

    // If visiting a protected page and not logged in, redirect to login
    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If visiting landing/login/signup and already logged in, redirect to dashboard
    if (isAuthPage && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public marketing routes (added to skip middleware overhead)
     */
    '/((?!_next/static|_next/image|favicon.ico|blog|exams|glossary|best-ai-for|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
