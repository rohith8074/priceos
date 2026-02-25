import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // Check for Neon (better-auth) session cookie
  const devSession = request.cookies.get('better-auth.session_token');
  const prodSession = request.cookies.get('__Secure-better-auth.session_token');
  const session = devSession || prodSession;

  const { pathname } = request.nextUrl;

  // Paths that are fully public (no auth required)
  const publicPaths = ['/login', '/waitlist', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 1. If no session and trying to access private route, redirect to login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If session exists and trying to access /login, redirect to dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Special case: redirect root to login or dashboard
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
