import { db } from "@/lib/db";
import { reservations, listings } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { OperationsClient } from "./operations-client";
import { format, subDays, addDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
    const today = new Date();
    const startDate = format(subDays(today, 2), "yyyy-MM-dd");
    const endDate = format(addDays(today, 90), "yyyy-MM-dd");

    const reservationRows = await db
        .select({
            id: reservations.id,
            listingId: reservations.listingId,
            propertyName: listings.name,
            startDate: reservations.startDate,
            endDate: reservations.endDate,
            guestName: reservations.guestName,
            guestEmail: reservations.guestEmail,
            guestPhone: reservations.guestPhone,
            numGuests: reservations.numGuests,
            channelName: reservations.channelName,
            totalPrice: reservations.totalPrice,
            pricePerNight: reservations.pricePerNight,
            reservationStatus: reservations.reservationStatus,
        })
        .from(reservations)
        .innerJoin(listings, eq(reservations.listingId, listings.id))
        .where(
            and(
                gte(reservations.endDate, startDate),
                lte(reservations.endDate, endDate)
            )
        )
        .orderBy(reservations.endDate);

    // Map to the shape OperationsClient expects (backwards-compat)
    const mapped = reservationRows.map(r => ({
        id: r.id,
        listingId: r.listingId,
        propertyName: r.propertyName,
        startDate: r.startDate,
        endDate: r.endDate,
        guestDetails: {
            name: r.guestName,
            email: r.guestEmail,
            phone: r.guestPhone,
            numberOfGuests: r.numGuests,
        },
        financials: {
            channelName: r.channelName,
            totalPrice: r.totalPrice ? parseFloat(r.totalPrice) : 0,
            price_per_night: r.pricePerNight ? `${r.pricePerNight}` : null,
            reservationStatus: r.reservationStatus,
        },
        type: "reservation" as const,
    }));

    return (
        <div className="flex-1 flex flex-col p-8 bg-muted/5 h-full overflow-hidden">
            <div className="mb-8 shrink-0">
                <h1 className="text-3xl font-bold mb-2">Logistics & Cleaning</h1>
                <p className="text-muted-foreground text-sm max-w-2xl">
                    Automated cleaning and maintenance schedule generated from PMS reservation check-outs.
                </p>
            </div>

            <OperationsClient reservations={mapped} />
        </div>
    );
}
