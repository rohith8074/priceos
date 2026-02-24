import { db, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('priceos-session');

    if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sessionData;
    try {
        sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch (e) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = sessionData.username || "rohith";
    let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    if (!settings) {
        // Create default settings if they don't exist
        const [newSettings] = await db.insert(userSettings).values({
            userId,
            fullName: userId,
            email: `${userId}@example.com`,
            preferences: {},
        }).returning();
        settings = newSettings;
    }

    return NextResponse.json(settings);
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('priceos-session');

    if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sessionData;
    try {
        sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch (e) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = sessionData.username || "rohith";
    const body = await req.json();

    const { fullName, email, lyzrApiKey, hostawayApiKey, preferences } = body;

    const result = await db
        .insert(userSettings)
        .values({
            userId,
            fullName: fullName || userId,
            email: email || `${userId}@example.com`,
            lyzrApiKey,
            hostawayApiKey,
            preferences: preferences || {},
        })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                fullName: fullName || userId,
                email: email || `${userId}@example.com`,
                lyzrApiKey,
                hostawayApiKey,
                preferences: preferences || {},
                updatedAt: new Date(),
            },
        })
        .returning();

    return NextResponse.json(result[0]);
}
