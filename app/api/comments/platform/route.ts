import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { comments } from '@/lib/db/schema'
import { eq, desc, isNull, and } from 'drizzle-orm'

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
    const platform = searchParams.get('platform')

    // Build query conditions
    const conditions = [
      eq(comments.userId, sessionData.userId),
      isNull(comments.parentCommentId) // Only get top-level comments
    ]

    if (platform && platform !== 'all') {
      conditions.push(eq(comments.platform, platform))
    }

    // Get comments with replies
    const platformComments = await db
      .select()
      .from(comments)
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt))

    // TODO: Fetch replies for each comment if needed

    return NextResponse.json({ comments: platformComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
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
    const { commentId, content } = body

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      )
    }

    // Get the original comment to reply to
    const originalComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1)

    if (originalComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Create reply
    const reply = await db
      .insert(comments)
      .values({
        userId: sessionData.userId,
        platform: originalComment[0].platform,
        platformPostId: originalComment[0].platformPostId,
        content,
        parentCommentId: commentId,
        isReply: true,
        status: 'sent',
      })
      .returning()

    // TODO: Send reply through actual platform API
    // Example: await replyToFacebookComment(originalComment[0].platformCommentId, content)

    return NextResponse.json({
      success: true,
      reply: reply[0],
    })
  } catch (error) {
    console.error('Error posting reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}