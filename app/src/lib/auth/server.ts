import { createNeonAuth } from '@neondatabase/auth/next/server';

// Server auth instance with explicit configuration
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'http://localhost:3000',
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET || 'temporary-build-time-secret-at-least-thirty-two-chars' },
});
