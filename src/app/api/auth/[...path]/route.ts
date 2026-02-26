import { NextRequest, NextResponse } from 'next/server';
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
    // Priority: explicit config > Vercel production URL > Vercel deployment URL
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return undefined;
}

const PRODUCTION_ORIGIN = getProductionOrigin();

async function createProxiedRequest(request: NextRequest): Promise<NextRequest> {
    if (!PRODUCTION_ORIGIN) return request;

    // Clone headers and override Origin to match what Neon Auth expects
    const headers = new Headers(request.headers);
    headers.set('origin', PRODUCTION_ORIGIN);

    // Also fix referer if present
    const referer = headers.get('referer');
    if (referer) {
        try {
            const refUrl = new URL(referer);
            const prodUrl = new URL(PRODUCTION_ORIGIN);
            refUrl.host = prodUrl.host;
            refUrl.protocol = prodUrl.protocol;
            headers.set('referer', refUrl.toString());
        } catch { /* keep original referer */ }
    }

    // Create a new request with the modified headers
    return new NextRequest(request.url, {
        method: request.method,
        headers,
        body: request.body,
        // @ts-ignore - duplex is needed for streaming bodies
        duplex: 'half',
    });
}

const handler = auth.handler();

export async function GET(request: NextRequest, context: any) {
    const proxiedRequest = await createProxiedRequest(request);
    return handler.GET(proxiedRequest, context);
}

export async function POST(request: NextRequest, context: any) {
    const proxiedRequest = await createProxiedRequest(request);
    return handler.POST(proxiedRequest, context);
}

export async function PUT(request: NextRequest, context: any) {
    const proxiedRequest = await createProxiedRequest(request);
    return handler.PUT(proxiedRequest, context);
}

export async function PATCH(request: NextRequest, context: any) {
    const proxiedRequest = await createProxiedRequest(request);
    return handler.PATCH(proxiedRequest, context);
}

export async function DELETE(request: NextRequest, context: any) {
    const proxiedRequest = await createProxiedRequest(request);
    return handler.DELETE(proxiedRequest, context);
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
