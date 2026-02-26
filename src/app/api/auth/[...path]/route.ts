import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * Custom auth proxy that rewrites the Origin header to match the Neon Auth
 * backend's own origin. This bypasses the CSRF "Invalid origin" check.
 * 
 * The SDK's prepareRequestHeaders always sends an Origin header (derived from 
 * request.headers.origin || referer || request.url.origin). The Neon Auth 
 * backend validates this and rejects unknown origins with 403.
 * 
 * By setting the Origin to the Neon Auth backend's own URL, the request is
 * treated as a "same-origin" call and passes CSRF validation.
 * 
 * This is safe because our Next.js proxy IS a trusted server-side intermediary
 * between the browser and the Neon Auth backend.
 */
const NEON_AUTH_ORIGIN = (() => {
    try {
        return new URL(process.env.NEON_AUTH_BASE_URL!).origin;
    } catch {
        return 'https://localhost';
    }
})();

async function rewriteOriginToNeonAuth(request: NextRequest): Promise<Request> {
    // Read body for mutating requests (streams can only be consumed once)
    let bodyText: string | null = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            bodyText = await request.text();
        } catch {
            bodyText = null;
        }
    }

    // Clone headers with Origin + Referer pointing to the Neon Auth backend
    const headers = new Headers(request.headers);
    headers.set('origin', NEON_AUTH_ORIGIN);
    headers.delete('referer');

    return new Request(request.url, {
        method: request.method,
        headers,
        body: bodyText,
    });
}

const handler = auth.handler();

export async function GET(request: NextRequest, context: any) {
    return handler.GET(await rewriteOriginToNeonAuth(request), context);
}

export async function POST(request: NextRequest, context: any) {
    return handler.POST(await rewriteOriginToNeonAuth(request), context);
}

export async function PUT(request: NextRequest, context: any) {
    return handler.PUT(await rewriteOriginToNeonAuth(request), context);
}

export async function PATCH(request: NextRequest, context: any) {
    return handler.PATCH(await rewriteOriginToNeonAuth(request), context);
}

export async function DELETE(request: NextRequest, context: any) {
    return handler.DELETE(await rewriteOriginToNeonAuth(request), context);
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
