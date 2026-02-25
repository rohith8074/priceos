import { db, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

async function getNeonAuthUser() {
    try {
        const res = await auth.getSession();
        return res?.data?.user || null;
    } catch {
        return null;
    }
}

export async function GET() {
    const neonUser = await getNeonAuthUser();

    if (!neonUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = neonUser.id;
    let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    if (!settings) {
        const [newSettings] = await db.insert(userSettings).values({
            userId,
            fullName: neonUser.name || "",
            email: neonUser.email || "",
            preferences: {},
        }).returning();
        settings = newSettings;
    }

    return NextResponse.json(settings);
}

export async function POST(req: Request) {
    const neonUser = await getNeonAuthUser();

    if (!neonUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = neonUser.id;
    const body = await req.json();
    const { fullName, email, lyzrApiKey, hostawayApiKey, preferences } = body;

    const result = await db
        .insert(userSettings)
        .values({
            userId,
            fullName: fullName || neonUser.name || "",
            email: email || neonUser.email || "",
            lyzrApiKey,
            hostawayApiKey,
            preferences: preferences || {},
        })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                fullName: fullName || neonUser.name || "",
                email: email || neonUser.email || "",
                lyzrApiKey,
                hostawayApiKey,
                preferences: preferences || {},
                updatedAt: new Date(),
            },
        })
        .returning();

    return NextResponse.json(result[0]);
}
