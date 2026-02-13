import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { id, ruleId } = await params;
  const body = await request.json();
  const pms = createPMSClient();
  const rule = await pms.updateSeasonalRule(id, Number(ruleId), body);
  return NextResponse.json(rule);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { id, ruleId } = await params;
  const pms = createPMSClient();
  await pms.deleteSeasonalRule(id, Number(ruleId));
  return NextResponse.json({ success: true });
}
