import { db } from "@/lib/db";
import { activityTimeline, listings } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { OperationsClient } from "./operations-client";
import { format, subDays, addDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
    const today = new Date();
    const startDate = format(subDays(today, 2), "yyyy-MM-dd");
    const endDate = format(addDays(today, 14), "yyyy-MM-dd");

    const reservations = await db
        .select({
            id: activityTimeline.id,
            listingId: activityTimeline.listingId,
            propertyName: listings.name,
            startDate: activityTimeline.startDate,
            endDate: activityTimeline.endDate,
            guestDetails: activityTimeline.guestDetails,
            financials: activityTimeline.financials,
            type: activityTimeline.type,
        })
        .from(activityTimeline)
        .innerJoin(listings, eq(activityTimeline.listingId, listings.id))
        .where(
            and(
                eq(activityTimeline.type, "reservation"),
                gte(activityTimeline.endDate, startDate),
                lte(activityTimeline.endDate, endDate) // Looking at checkouts!
            )
        )
        .orderBy(activityTimeline.endDate);

    return (
        <div className="flex-1 flex flex-col p-8 bg-muted/5 h-full overflow-hidden">
            <div className="mb-8 shrink-0">
                <h1 className="text-3xl font-bold mb-2">Logistics & Cleaning</h1>
                <p className="text-muted-foreground text-sm max-w-2xl">
                    Automated cleaning and maintenance schedule generated from PMS reservation check-outs.
                </p>
            </div>

            <OperationsClient reservations={reservations} />
        </div>
    );
}
