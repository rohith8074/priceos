import { NextResponse } from "next/server";

export async function GET() {
  const syncStatus = globalThis.syncStatus || { status: 'idle', message: '' };

  // Auto-reset to idle after 30 seconds of being complete/error
  if ((syncStatus.status === 'complete' || syncStatus.status === 'error') && syncStatus.startedAt) {
    const elapsed = Date.now() - syncStatus.startedAt;
    if (elapsed > 30000) {
      globalThis.syncStatus = { status: 'idle', message: '' };
    }
  }

  return NextResponse.json(syncStatus);
}
