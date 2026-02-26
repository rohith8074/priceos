import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;
const NEON_AUTH_ORIGIN = (() => {
    try { return new URL(NEON_AUTH_BASE_URL).origin; } catch { return ''; }
})();

/**
 * POST /api/auth/admin-reset-password
 * 
 * Resets a user's password by calling the Neon Auth backend directly.
 * Uses server-to-server call with the backend's own origin to bypass CSRF.
 * 
 * Flow: request-password-reset → get token → reset-password with token
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

        // Step 1: Request password reset — this generates a token server-side
        const resetReqRes = await fetch(new URL('request-password-reset', baseUrl).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': NEON_AUTH_ORIGIN,
                'x-neon-auth-server-proxy': 'nextjs',
            },
            body: JSON.stringify({ email }),
        });

        console.log('[admin-reset-password] request-password-reset status:', resetReqRes.status);

        if (!resetReqRes.ok) {
            const errText = await resetReqRes.text();
            console.error('[admin-reset-password] request-password-reset failed:', errText);

            if (resetReqRes.status === 404 || errText.includes('not found') || errText.includes('NOT_FOUND')) {
                return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to initiate password reset" }, { status: 500 });
        }

        // Try to extract the token from the response
        let resetData: any = {};
        try {
            resetData = await resetReqRes.json();
            console.log('[admin-reset-password] reset response keys:', Object.keys(resetData));
        } catch {
            resetData = {};
        }

        // Check if token is available (some implementations return it)
        const token = resetData?.token || resetData?.data?.token || resetData?.url?.split('token=')[1];

        if (token) {
            // Step 2: Use the token to reset the password immediately
            const resetRes = await fetch(new URL('reset-password', baseUrl).toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': NEON_AUTH_ORIGIN,
                    'x-neon-auth-server-proxy': 'nextjs',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            if (resetRes.ok) {
                return NextResponse.json({ success: true, message: "Password updated successfully" });
            }

            const resetErr = await resetRes.text();
            console.error('[admin-reset-password] reset-password failed:', resetErr);
            return NextResponse.json({ error: "Failed to set new password" }, { status: 500 });
        }

        // Token was not returned — it was sent via email instead
        return NextResponse.json({
            success: true,
            message: "A password reset link has been sent to your email. Check your inbox to complete the reset.",
            emailSent: true,
        });

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
