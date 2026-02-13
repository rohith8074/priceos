import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pms = createPMSClient();
  const rules = await pms.getSeasonalRules(id);
  return NextResponse.json(rules);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const pms = createPMSClient();
  const rule = await pms.createSeasonalRule(id, body);
  return NextResponse.json(rule);
}
