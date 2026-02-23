import { NextRequest, NextResponse } from "next/server";
import { db, reservations } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") as "portfolio" | "property";
    const propertyId = searchParams.get("propertyId");

    if (!context) {
      return NextResponse.json(
        { error: "Missing context parameter" },
        { status: 400 }
      );
    }

    if (context === "portfolio") {
      const allReservations = await db.select().from(reservations);
      return NextResponse.json({ reservations: allReservations });
    } else {
      if (!propertyId) {
        return NextResponse.json(
          { error: "Missing propertyId for property context" },
          { status: 400 }
        );
      }

      const listingId = parseInt(propertyId);
      const propertyReservations = await db
        .select()
        .from(reservations)
        .where(eq(reservations.listingId, listingId));

      return NextResponse.json({ reservations: propertyReservations });
    }
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
