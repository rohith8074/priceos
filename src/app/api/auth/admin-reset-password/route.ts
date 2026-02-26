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
        const startTime = new Date();

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
            return NextResponse.json({ error: `Auth request failed: ${errText}` }, { status: resetReqRes.status });
        }

        // Step 2: Poll for the SPECIFIC new token created after startTime
        let token = null;
        console.log(`[admin-reset-password] Polling for token created after ${startTime.toISOString()}...`);

        for (let i = 0; i < 6; i++) {
            await new Promise(r => setTimeout(r, 600));
            const rows = await sql`
                SELECT "value", "identifier" FROM neon_auth.verification 
                WHERE identifier LIKE 'reset-password:%'
                AND "createdAt" >= ${startTime}
                ORDER BY "createdAt" DESC LIMIT 1
            `;
            if (rows.length > 0) {
                // Some versions use the value, others use the identifier suffix
                token = rows[0].value;
                console.log(`[admin-reset-password] Found token in DB.`);
                break;
            }
        }

        if (!token) {
            return NextResponse.json({ error: "Reset token not found in database. Please try again." }, { status: 500 });
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
        console.error('[admin-reset-password] Reset API failed:', resetRes.status, resetErr);

        // Return the actual error from Neon Auth so we can see it in the UI
        return NextResponse.json({
            error: `Auth Backend Error: ${resetErr}`,
            tokenPreview: token.substring(0, 5) + '...'
        }, { status: 500 });

    } catch (error: any) {
        console.error("[admin-reset-password] Catch Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
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
