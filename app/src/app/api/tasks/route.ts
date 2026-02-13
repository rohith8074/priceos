import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function GET() {
  const pms = createPMSClient();
  try {
    const tasks = await pms.getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pms = createPMSClient();
  try {
    const task = await pms.createTask(body);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 400 }
    );
  }
}
