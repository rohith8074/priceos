import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get authenticated user
    const authResult = await auth();
    const session = authResult?.session;

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1);

    if (settings.length === 0) {
      return NextResponse.json({
        lyzrApiKey: '',
        hasApiKey: false,
      });
    }

    // Return masked API key (show only last 4 characters)
    const apiKey = settings[0].lyzrApiKey || '';
    const masked = apiKey
      ? `${'*'.repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`
      : '';

    return NextResponse.json({
      lyzrApiKey: masked,
      hasApiKey: !!apiKey,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await auth();
    const session = authResult?.session;

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lyzrApiKey } = body;

    if (!lyzrApiKey || typeof lyzrApiKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          lyzrApiKey,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.userId));
    } else {
      // Insert new settings
      await db.insert(userSettings).values({
        userId: session.userId,
        lyzrApiKey,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
