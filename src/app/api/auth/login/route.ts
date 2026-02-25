import { db, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const cleanUsername = username.trim().toLowerCase();

        if (password !== 'Rohith@123') {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        let user = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, cleanUsername),
        });

        if (!user && cleanUsername === 'rohith') {
            const prefs = { role: 'admin' };
            const [newUser] = await db.insert(userSettings).values({
                userId: 'rohith',
                fullName: 'Rohith',
                email: 'rohith@example.com',
                preferences: prefs
            }).returning();
            user = newUser;
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const role = (user.preferences as any)?.role || 'user';

        if (role !== 'admin') {
            return NextResponse.json({ error: "Access Denied: Only Admins can log in" }, { status: 403 });
        }

        return NextResponse.json({ success: true, user: { username: user.userId, role } });

    } catch (e: any) {
        console.error("Login Error:", e);
        return NextResponse.json({ error: e.message || "An unexpected error occurred" }, { status: 500 });
    }
}
