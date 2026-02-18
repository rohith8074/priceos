import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

// Create the auth middleware using v0.2 API
const authMiddleware = auth.middleware({
  loginUrl: '/auth/sign-in',
});

export default function middleware(request: NextRequest) {
  // Allow root path (landing page) and auth routes without authentication
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Apply auth middleware to all other routes
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
