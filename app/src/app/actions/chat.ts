'use server'

import { db } from '@/lib/db'
import { chatMessages } from '@/lib/db/schema'

export async function saveChatMessage(data: {
  userId?: string
  sessionId: string
  role: string
  content: string
  propertyId?: number
  structured?: Record<string, unknown>
}) {
  await db.insert(chatMessages).values({
    userId: data.userId ?? null,
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    propertyId: data.propertyId ?? null,
    structured: data.structured ?? null,
  })
}
