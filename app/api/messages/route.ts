import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { messages, contacts, users } from '@/lib/db/schema'
import { eq, desc, or, and, sql } from 'drizzle-orm'

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

    if (conversationId) {
      // Get the contact's email for this conversation
      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, conversationId))
        .limit(1)

      const contactEmail = contact[0]?.email

      // Get messages for a specific conversation
      // Include messages where:
      // 1. Current user sent to this contact OR
      // 2. This contact sent to current user (by email)
      const conversationMessages = await db
        .select({
          id: messages.id,
          content: messages.content,
          type: messages.type,
          status: messages.status,
          createdAt: messages.createdAt,
          senderId: messages.userId,
          senderName: users.name,
          senderEmail: users.email,
          contactId: messages.contactId,
          recipientEmail: messages.recipientEmail,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(
          or(
            // Messages sent by current user to this contact
            and(
              eq(messages.userId, sessionData.userId),
              eq(messages.contactId, conversationId)
            ),
            // Messages sent TO current user from this contact
            and(
              eq(messages.recipientEmail, sessionData.email),
              contactEmail ? eq(users.email, contactEmail) : sql`false`
            )
          )
        )
        .orderBy(messages.createdAt)

      // Mark messages as read if they were sent to the current user
      const unreadMessageIds = conversationMessages
        .filter(msg => msg.recipientEmail === sessionData.email && msg.status === 'sent')
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        await db
          .update(messages)
          .set({ status: 'read' })
          .where(
            and(
              sql`${messages.id} IN (${sql.join(unreadMessageIds.map(id => sql`${id}`), sql`, `)})`
            )
          )
      }

      return NextResponse.json({ messages: conversationMessages })
    } else {
      // Get all conversations for the current user
      // Include both contacts they've messaged AND people who've messaged them
      
      // First, get contacts the user has created
      const userContacts = await db
        .select({
          contactId: contacts.id,
          contactName: sql`COALESCE(${contacts.firstName} || ' ' || ${contacts.lastName}, ${contacts.email})`.as('contactName'),
          contactEmail: contacts.email,
        })
        .from(contacts)
        .where(eq(contacts.userId, sessionData.userId))

      // Get all messages involving the current user (sent or received)
      const allMessages = await db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          status: messages.status,
          userId: messages.userId,
          contactId: messages.contactId,
          recipientEmail: messages.recipientEmail,
          senderEmail: users.email,
          senderName: users.name,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(
          or(
            eq(messages.userId, sessionData.userId),
            eq(messages.recipientEmail, sessionData.email)
          )
        )
        .orderBy(desc(messages.createdAt))

      // Build conversations list
      const conversationsMap = new Map()

      // Add user's contacts
      userContacts.forEach(contact => {
        conversationsMap.set(contact.contactId, {
          contactId: contact.contactId,
          contactName: contact.contactName,
          contactEmail: contact.contactEmail,
          lastMessage: null,
          lastMessageTime: null,
          messageStatus: null,
          unreadCount: 0,
        })
      })

      // Process messages to update conversation info
      allMessages.forEach(msg => {
        let conversationKey = msg.contactId
        
        // If message was sent TO the current user, find/create conversation for the sender
        if (msg.recipientEmail === sessionData.email) {
          // Check if we have a contact for this sender
          const existingContact = userContacts.find(c => c.contactEmail === msg.senderEmail)
          if (existingContact) {
            conversationKey = existingContact.contactId
          }
        }

        if (conversationKey && conversationsMap.has(conversationKey)) {
          const conv = conversationsMap.get(conversationKey)
          
          // Update last message if this is newer
          if (!conv.lastMessageTime || msg.createdAt > conv.lastMessageTime) {
            conv.lastMessage = msg.content
            conv.lastMessageTime = msg.createdAt
            conv.messageStatus = msg.status
          }
          
          // Count unread messages sent TO the current user
          if (msg.recipientEmail === sessionData.email && msg.status === 'sent') {
            conv.unreadCount++
          }
        }
      })

      const uniqueConversations = Array.from(conversationsMap.values())
        .filter(conv => conv.lastMessage !== null) // Only show conversations with messages
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        })

      return NextResponse.json({ conversations: uniqueConversations })
    }
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
    const { contactId, content, type = 'chat' } = body

    if (!contactId || !content) {
      return NextResponse.json(
        { error: 'Contact ID and content are required' },
        { status: 400 }
      )
    }

    // Get the contact's email to set as recipient
    const contact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1)

    if (contact.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Create new message with recipient email
    const newMessage = await db
      .insert(messages)
      .values({
        userId: sessionData.userId,
        contactId,
        recipientEmail: contact[0].email, // Set the recipient's email
        content,
        type,
        status: 'sent',
      })
      .returning()

    // TODO: Send real-time notification to recipient if they're online
    // This would typically use WebSockets or Server-Sent Events
    // For now, we'll just store the message

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