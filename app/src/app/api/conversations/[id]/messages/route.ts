import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pms = createPMSClient();
  const messages = await pms.getConversationMessages(Number(id));
  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await request.json();
  const pms = createPMSClient();
  const message = await pms.sendMessage(Number(id), content);
  return NextResponse.json(message);
}
