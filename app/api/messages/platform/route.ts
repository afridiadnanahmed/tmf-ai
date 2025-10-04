import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Get messages for a specific conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, sessionData.userId),
          eq(messages.conversationId, conversationId)
        )
      )
      .orderBy(messages.createdAt)

    return NextResponse.json({ messages: conversationMessages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { conversationId, platform, content } = body

    if (!conversationId || !platform || !content) {
      return NextResponse.json(
        { error: 'Conversation ID, platform, and content are required' },
        { status: 400 }
      )
    }

    // In a real app, this would send the message through the platform's API
    // For now, we'll just save it to the database
    const newMessage = await db
      .insert(messages)
      .values({
        userId: sessionData.userId,
        conversationId,
        platform,
        content,
        isIncoming: false, // Outgoing message
        status: 'sent',
      })
      .returning()

    // TODO: Integrate with actual platform APIs (Facebook, Instagram, WhatsApp)
    // Example: await sendToFacebook(conversationId, content)

    return NextResponse.json({
      success: true,
      message: newMessage[0],
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}