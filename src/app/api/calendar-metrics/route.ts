import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster, listings, reservations } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count, avg } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const listingId = searchParams.get("listingId");
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!listingId || !from || !to) {
            return NextResponse.json(
                { error: "listingId, from, and to are required" },
                { status: 400 }
            );
        }

        const lid = parseInt(listingId, 10);

        // Query inventory_master for the date range
        const metrics = await db
            .select({
                totalDays: count(),
                bookedDays: sql<number>`COUNT(CASE WHEN ${inventoryMaster.status} IN ('reserved', 'booked') THEN 1 END)`,
                availableDays: sql<number>`COUNT(CASE WHEN ${inventoryMaster.status} = 'available' THEN 1 END)`,
                blockedDays: sql<number>`COUNT(CASE WHEN ${inventoryMaster.status} = 'blocked' THEN 1 END)`,
                avgPrice: avg(inventoryMaster.currentPrice),
            })
            .from(inventoryMaster)
            .where(
                and(
                    eq(inventoryMaster.listingId, lid),
                    gte(inventoryMaster.date, from),
                    lte(inventoryMaster.date, to)
                )
            );

        const result = metrics[0];
        const totalDays = Number(result?.totalDays || 0);
        const bookedDays = Number(result?.bookedDays || 0);
        const availableDays = Number(result?.availableDays || 0);
        const blockedDays = Number(result?.blockedDays || 0);
        let avgPriceVal = result?.avgPrice ? parseFloat(String(result.avgPrice)) : 0;

        // If there's no data in inventory_master for this period, fallback to the base price from listings
        if (avgPriceVal === 0) {
            const prop = await db.select({ price: listings.price }).from(listings).where(eq(listings.id, lid));
            if (prop.length > 0) {
                avgPriceVal = parseFloat(String(prop[0].price));
            }
        }

        // Occupancy = booked / (total - blocked) * 100
        // If all days are blocked, occupancy is 0
        const bookableDays = totalDays - blockedDays;
        const occupancy = bookableDays > 0
            ? Math.round((bookedDays / bookableDays) * 100)
            : 0;

        const calendarDays = await db
            .select({
                date: inventoryMaster.date,
                status: inventoryMaster.status,
                price: inventoryMaster.currentPrice,
            })
            .from(inventoryMaster)
            .where(
                and(
                    eq(inventoryMaster.listingId, lid),
                    gte(inventoryMaster.date, from),
                    lte(inventoryMaster.date, to)
                )
            )
            .orderBy(inventoryMaster.date);

        const reservationsResp = await db
            .select({
                guestName: reservations.guestName,
                startDate: reservations.startDate,
                endDate: reservations.endDate,
                totalPrice: reservations.totalPrice,
                pricePerNight: reservations.pricePerNight,
                channelName: reservations.channelName,
                reservationStatus: reservations.reservationStatus,
            })
            .from(reservations)
            .where(
                and(
                    eq(reservations.listingId, lid),
                    lte(reservations.startDate, to),
                    gte(reservations.endDate, from)
                )
            );

        return NextResponse.json({
            listingId: lid,
            dateRange: { from, to },
            totalDays,
            bookedDays,
            availableDays,
            blockedDays,
            bookableDays,
            occupancy,
            avgPrice: Math.round(avgPriceVal * 100) / 100,
            calendarDays,
            reservations: reservationsResp,
        });
    } catch (error) {
        console.error("Calendar Metrics Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
