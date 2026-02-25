import { db, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function GET() {
    try {
        const res = await auth.getSession();
        const neonUser = res?.data?.user;

        if (!neonUser) {
            return NextResponse.json({ approved: false, reason: "unauthenticated" }, { status: 401 });
        }

        // Look up the user's approval status in our DB
        let record = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, neonUser.id),
        });

        // If no record exists yet, create one with isApproved=false (waitlist)
        if (!record) {
            const [newRecord] = await db.insert(userSettings).values({
                userId: neonUser.id,
                fullName: neonUser.name || "",
                email: neonUser.email || "",
                isApproved: false,
                preferences: {},
            }).returning();
            record = newRecord;
        }

        return NextResponse.json({ approved: record.isApproved });
    } catch (err) {
        console.error("[check-approval] error:", err);
        return NextResponse.json({ approved: false, reason: "error" }, { status: 500 });
    }
}
