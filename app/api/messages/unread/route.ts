import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { messages, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
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

    // Get unread messages for the current user
    const unreadMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
        senderId: messages.userId,
        senderName: users.name,
        senderEmail: users.email,
        recipientEmail: messages.recipientEmail,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(
        and(
          eq(messages.recipientEmail, sessionData.email),
          eq(messages.status, 'sent') // 'sent' status means unread
        )
      )
      .orderBy(desc(messages.createdAt))

    // Get count of unread messages
    const unreadCount = unreadMessages.length

    return NextResponse.json({ 
      unreadMessages,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching unread messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}