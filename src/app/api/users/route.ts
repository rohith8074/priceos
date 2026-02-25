import { db, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, fullName, email, role } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const cleanUserId = userId.trim().toLowerCase();
        const prefs = { role: role || 'user' };

        const result = await db.insert(userSettings).values({
            userId: cleanUserId,
            fullName,
            email,
            isApproved: true, // Manually added users are auto-approved
            preferences: prefs
        }).onConflictDoNothing().returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "User already exists with this ID" }, { status: 400 });
        }

        return NextResponse.json({ success: true, user: result[0] });
    } catch (e: any) {
        console.error("User creation error:", e);
        return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await db.query.userSettings.findMany();
        const users = result.map(u => ({
            id: u.id,
            userId: u.userId,
            fullName: u.fullName,
            email: u.email,
            isApproved: u.isApproved,
            role: (u.preferences as any)?.role || 'user'
        }));
        return NextResponse.json(users);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

        await db.delete(userSettings).where(eq(userSettings.userId, userId));
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { userId, role, fullName, email, isApproved } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const user = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentPrefs = (user.preferences as any) || {};
        const newPrefs = role ? { ...currentPrefs, role } : currentPrefs;

        const updateData: any = { preferences: newPrefs };
        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (isApproved !== undefined) updateData.isApproved = isApproved;

        await db.update(userSettings)
            .set(updateData)
            .where(eq(userSettings.userId, userId));

        return NextResponse.json({ success: true, user: { ...user, ...updateData } });
    } catch (e: any) {
        console.error("User update error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
