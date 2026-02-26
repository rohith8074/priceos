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
 * 
 * Resets a user's password directly without email verification.
 * 
 * Flow:
 * 1. Call Neon Auth's request-password-reset → creates token in verification table
 * 2. Read the token directly from neon_auth.verification table 
 * 3. Call Neon Auth's reset-password with the token + new password
 * 4. Password is updated immediately — no email needed
 */
export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const baseUrl = NEON_AUTH_BASE_URL.endsWith('/') ? NEON_AUTH_BASE_URL : `${NEON_AUTH_BASE_URL}/`;

        // Step 1: Request password reset — this creates a token in neon_auth.verification
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
            console.error('[admin-reset-password] request-password-reset failed:', resetReqRes.status, errText);
            if (resetReqRes.status === 404 || errText.includes('not found') || errText.includes('NOT_FOUND')) {
                return NextResponse.json({ error: "No account found with this email in the auth system" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to initiate password reset" }, { status: 500 });
        }

        // Step 2: Read the token directly from the database
        // The verification table stores: identifier = email, value = token
        const rows = await sql`
            SELECT "value" FROM neon_auth.verification 
            WHERE identifier = ${email} 
            ORDER BY "createdAt" DESC 
            LIMIT 1
        `;

        if (!rows || rows.length === 0) {
            console.error('[admin-reset-password] No verification token found in DB for:', email);
            return NextResponse.json({ error: "Failed to generate reset token" }, { status: 500 });
        }

        const token = rows[0].value;

        // Step 3: Use the token to reset the password immediately
        const resetRes = await fetch(new URL('reset-password', baseUrl).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': NEON_AUTH_ORIGIN,
            },
            body: JSON.stringify({ token, newPassword }),
        });

        if (resetRes.ok) {
            // Clean up: delete the used verification token
            await sql`
                DELETE FROM neon_auth.verification 
                WHERE identifier = ${email}
            `.catch(() => { }); // non-critical cleanup

            return NextResponse.json({ success: true, message: "Password updated successfully" });
        }

        const resetErr = await resetRes.text();
        console.error('[admin-reset-password] reset-password failed:', resetRes.status, resetErr);
        return NextResponse.json({ error: "Failed to set new password. Token may have expired." }, { status: 500 });

    } catch (error: any) {
        console.error("[admin-reset-password] error:", error);
        return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
    }
}

/**
 * GET /api/auth/admin-reset-password?email=xxx
 * 
 * Check if an email exists in the system and return the user name.
 */
export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
        return NextResponse.json({ exists: false, error: "Email required" }, { status: 400 });
    }

    try {
        const { db, userSettings } = await import("@/lib/db");
        const { eq } = await import("drizzle-orm");

        const user = await db.query.userSettings.findFirst({
            where: eq(userSettings.email, email),
        });

        return NextResponse.json({
            exists: !!user,
            name: user?.fullName || null,
        });
    } catch (error) {
        console.error("Email check error:", error);
        return NextResponse.json({ exists: false, error: "Failed to check email" }, { status: 500 });
    }
}
