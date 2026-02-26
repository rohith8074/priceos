import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * Custom auth proxy handler that overrides the Origin header
 * to match the production domain registered in Neon Auth.
 * 
 * This fixes the "Invalid origin" 403 error on Vercel preview deployments
 * where the URL changes on every push (e.g. priceos-abc123.vercel.app).
 * 
 * The Neon Auth backend validates the Origin header against its allowed origins.
 * By rewriting the Origin to our canonical production URL, all deployments work.
 */
function getProductionOrigin(): string | undefined {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return undefined;
}

/**
 * Creates a new Request with the Origin header overridden to the production URL.
 * Uses standard Request constructor (not NextRequest) for reliable body handling.
 * Reads body as text first since streams can only be consumed once.
 */
async function withProductionOrigin(request: NextRequest): Promise<Request> {
    const origin = getProductionOrigin();
    if (!origin) return request;

    // Read body as text for POST/PUT/PATCH (streams can only be read once)
    let bodyText: string | null = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            bodyText = await request.text();
        } catch {
            bodyText = null;
        }
    }

    // Clone all headers and override origin
    const headers = new Headers(request.headers);
    headers.set('origin', origin);

    // Also override referer to match
    const referer = headers.get('referer');
    if (referer) {
        try {
            const refUrl = new URL(referer);
            const prodUrl = new URL(origin);
            refUrl.host = prodUrl.host;
            refUrl.protocol = prodUrl.protocol;
            headers.set('referer', refUrl.toString());
        } catch { /* keep original */ }
    }

    // Log for debugging (remove in production later)
    console.log(`[Auth Proxy] ${request.method} ${request.nextUrl.pathname} → Origin overridden to: ${origin}`);

    // Use standard Request constructor for reliable body+header cloning
    return new Request(request.url, {
        method: request.method,
        headers,
        body: bodyText,
    });
}

const handler = auth.handler();

export async function GET(request: NextRequest, context: any) {
    return handler.GET(await withProductionOrigin(request), context);
}

export async function POST(request: NextRequest, context: any) {
    return handler.POST(await withProductionOrigin(request), context);
}

export async function PUT(request: NextRequest, context: any) {
    return handler.PUT(await withProductionOrigin(request), context);
}

export async function PATCH(request: NextRequest, context: any) {
    return handler.PATCH(await withProductionOrigin(request), context);
}

export async function DELETE(request: NextRequest, context: any) {
    return handler.DELETE(await withProductionOrigin(request), context);
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
