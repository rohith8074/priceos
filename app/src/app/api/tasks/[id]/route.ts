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
    const task = await pms.updateTask(Number(id), body);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 400 }
    );
  }
}
