import { db, userSettings } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.getSession();
    const user = session?.data?.user;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    if (!settings) {
        // Create default settings if they don't exist
        const [newSettings] = await db.insert(userSettings).values({
            userId,
            fullName: user.name,
            email: user.email,
            preferences: {},
        }).returning();
        settings = newSettings;
    }

    return NextResponse.json(settings);
}

export async function POST(req: Request) {
    const session = await auth.getSession();
    const user = session?.data?.user;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();

    const { fullName, email, lyzrApiKey, hostawayApiKey, preferences } = body;

    const result = await db
        .insert(userSettings)
        .values({
            userId,
            fullName: fullName || user.name,
            email: email || user.email,
            lyzrApiKey,
            hostawayApiKey,
            preferences: preferences || {},
        })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                fullName: fullName || user.name,
                email: email || user.email,
                lyzrApiKey,
                hostawayApiKey,
                preferences: preferences || {},
                updatedAt: new Date(),
            },
        })
        .returning();

    return NextResponse.json(result[0]);
}
