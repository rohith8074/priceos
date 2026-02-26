import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = 'force-dynamic';

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;
const NEON_AUTH_ORIGIN = (() => {
    try { return new URL(NEON_AUTH_BASE_URL).origin; } catch { return ''; }
})();

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/auth/admin-reset-password
 */
export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
        }

        const baseUrl = NEON_AUTH_BASE_URL.endsWith('/') ? NEON_AUTH_BASE_URL : `${NEON_AUTH_BASE_URL}/`;

        // Get the latest token ID before we request a new one
        const preRows = await sql`
            SELECT id FROM neon_auth.verification 
            WHERE identifier LIKE 'reset-password:%'
            ORDER BY "createdAt" DESC LIMIT 1
        `;
        const lastId = preRows.length > 0 ? preRows[0].id : null;

        // Step 1: Request password reset
        console.log(`[admin-reset-password] Requesting reset for ${email}...`);
        const resetReqRes = await fetch(new URL('request-password-reset', baseUrl).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': NEON_AUTH_ORIGIN,
            },
            body: JSON.stringify({ email }),
        });

        if (!resetReqRes.ok) {
            const errText = await resetReqRes.text();
            console.error('[admin-reset-password] Request failed:', resetReqRes.status, errText);
            return NextResponse.json({ error: "No account found or reset inhibited" }, { status: 404 });
        }

        // Step 2: Poll for the new token (it might take a split second)
        let token = null;
        for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 500)); // wait 500ms
            const rows = await sql`
                SELECT "value", id FROM neon_auth.verification 
                WHERE identifier LIKE 'reset-password:%'
                AND id != ${lastId || '00000000-0000-0000-0000-000000000000'}
                ORDER BY "createdAt" DESC LIMIT 1
            `;
            if (rows.length > 0) {
                token = rows[0].value;
                break;
            }
        }

        if (!token) {
            console.error('[admin-reset-password] Token never appeared in DB');
            return NextResponse.json({ error: "Failed to generate reset token" }, { status: 500 });
        }

        // Step 3: Reset password
        const resetRes = await fetch(new URL('reset-password', baseUrl).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': NEON_AUTH_ORIGIN,
            },
            body: JSON.stringify({ token, newPassword }),
        });

        if (resetRes.ok) {
            return NextResponse.json({ success: true, message: "Password updated successfully" });
        }

        const resetErr = await resetRes.text();
        console.error('[admin-reset-password] Reset failed:', resetRes.status, resetErr);
        return NextResponse.json({ error: "Failed to set new password" }, { status: 500 });

    } catch (error: any) {
        console.error("[admin-reset-password] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ exists: false }, { status: 400 });
    try {
        const { db, userSettings } = await import("@/lib/db");
        const { eq } = await import("drizzle-orm");
        const user = await db.query.userSettings.findFirst({ where: eq(userSettings.email, email) });
        return NextResponse.json({ exists: !!user, name: user?.fullName || null });
    } catch {
        return NextResponse.json({ exists: false }, { status: 500 });
    }
}
