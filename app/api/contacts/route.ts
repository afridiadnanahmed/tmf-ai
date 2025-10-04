import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { contacts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

    // Get all contacts for the user
    const userContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, sessionData.userId))
      .orderBy(contacts.createdAt)

    return NextResponse.json({ contacts: userContacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
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
    const { email, phone, firstName, lastName, company } = body

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Either email or phone is required' },
        { status: 400 }
      )
    }

    // Check if contact already exists
    const conditions = []
    if (email) conditions.push(eq(contacts.email, email))
    if (phone) conditions.push(eq(contacts.phone, phone))
    
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, sessionData.userId),
          conditions.length > 0 ? or(...conditions) : undefined
        )
      )
      .limit(1)

    if (existingContact.length > 0) {
      return NextResponse.json({ 
        success: true,
        contact: existingContact[0],
        message: 'Contact already exists' 
      })
    }

    // Create new contact
    const newContact = await db
      .insert(contacts)
      .values({
        userId: sessionData.userId,
        email,
        phone,
        firstName,
        lastName,
        company,
        tags: [],
        metadata: {},
      })
      .returning()

    return NextResponse.json({
      success: true,
      contact: newContact[0],
      message: 'Contact created successfully',
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add missing import
import { and, or } from 'drizzle-orm'