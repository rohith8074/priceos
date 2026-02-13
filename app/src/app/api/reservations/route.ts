import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pms = createPMSClient();
  try {
    const reservation = await pms.createReservation(body);
    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create reservation" },
      { status: 400 }
    );
  }
}
