import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // TODO: Replace with neonAuthMiddleware when Neon Auth is configured
  // import { neonAuthMiddleware } from '@neondatabase/auth/next/server';
  // export default neonAuthMiddleware({ loginUrl: '/auth/sign-in' });

  // For now, allow all requests through
  // Protect dashboard routes — uncomment when auth is ready:
  // const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  // const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
  //   request.nextUrl.pathname.startsWith('/properties') ||
  //   request.nextUrl.pathname.startsWith('/calendar') ||
  //   request.nextUrl.pathname.startsWith('/proposals') ||
  //   request.nextUrl.pathname.startsWith('/insights');

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
