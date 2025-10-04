import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { messageIds } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      )
    }

    // Mark messages as read only if they belong to the current user
    const result = await db
      .update(messages)
      .set({ status: 'read' })
      .where(
        and(
          eq(messages.recipientEmail, sessionData.email),
          sql`${messages.id} IN (${sql.join(messageIds.map(id => sql`${id}`), sql`, `)})`
        )
      )
      .returning()

    return NextResponse.json({
      success: true,
      updatedCount: result.length,
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}