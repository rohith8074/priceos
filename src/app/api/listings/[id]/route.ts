import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const pms = createPMSClient();
  try {
    const updated = await pms.updateListing(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
}
