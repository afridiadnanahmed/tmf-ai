import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth-utils'

// GET - Fetch all posts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    let conditions = [eq(posts.userId, session.id)]

    // Only filter by date range if not filtering by draft status (drafts can have no scheduledAt)
    if (status !== 'draft') {
      if (startDate) {
        conditions.push(gte(posts.scheduledAt, new Date(startDate)))
      }
      if (endDate) {
        conditions.push(lte(posts.scheduledAt, new Date(endDate)))
      }
    }

    if (status) {
      conditions.push(eq(posts.status, status))
    }

    const userPosts = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.scheduledAt))

    // Calculate stats
    const stats = {
      total: userPosts.length,
      completed: userPosts.filter(p => p.status === 'published').length,
      scheduled: userPosts.filter(p => p.status === 'scheduled').length,
      draft: userPosts.filter(p => p.status === 'draft').length,
    }

    return NextResponse.json({ posts: userPosts, stats })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, platform, image, scheduledAt, status } = body

    // Validation
    if (!content || !platform) {
      return NextResponse.json(
        { error: 'Content and platform are required' },
        { status: 400 }
      )
    }

    // Create the post
    const [newPost] = await db
      .insert(posts)
      .values({
        userId: session.id,
        content,
        platform,
        image: image || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: status || 'draft',
        metadata: {},
      })
      .returning()

    return NextResponse.json({ post: newPost }, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

// PUT - Update a post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, content, platform, image, scheduledAt, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const [updatedPost] = await db
      .update(posts)
      .set({
        ...(content && { content }),
        ...(platform && { platform }),
        ...(image !== undefined && { image }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, id), eq(posts.userId, session.id)))
      .returning()

    if (!updatedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, session.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
