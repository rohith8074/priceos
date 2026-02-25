import { db, userSettings } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function GET() {
    try {
        const res = await auth.getSession();
        const neonUser = res?.data?.user;

        if (!neonUser) {
            return NextResponse.json({ approved: false, reason: "unauthenticated" }, { status: 401 });
        }

        // Look up by Neon Auth UUID first
        let record = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, neonUser.id),
        });

        // Also check by email to prevent duplicates and merge legacy records
        if (!record && neonUser.email) {
            const emailRecord = await db.query.userSettings.findFirst({
                where: eq(userSettings.email, neonUser.email),
            });

            if (emailRecord) {
                // A record exists with this email (legacy username-based record)
                // Update it to use the Neon Auth UUID
                await db.update(userSettings)
                    .set({
                        userId: neonUser.id,
                        fullName: neonUser.name || emailRecord.fullName || "",
                    })
                    .where(eq(userSettings.id, emailRecord.id));

                record = { ...emailRecord, userId: neonUser.id };
            }
        }

        // If no record exists at all, create one with isApproved=false (waitlist)
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
