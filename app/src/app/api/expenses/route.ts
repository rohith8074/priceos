import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function GET() {
  const pms = createPMSClient();
  try {
    const expenses = await pms.getExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pms = createPMSClient();
  try {
    const expense = await pms.createExpense(body);
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create expense" },
      { status: 400 }
    );
  }
}
