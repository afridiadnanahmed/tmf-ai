import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { integrations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse session to get userId
    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { integrationId, config } = body

    if (!integrationId || !config) {
      return NextResponse.json(
        { error: 'Integration ID and configuration are required' },
        { status: 400 }
      )
    }

    // Validate configuration has at least one required field
    const validateConfig = (config: any) => {
      const requiredFields = ['apiKey', 'accountId', 'accessToken', 'apiSecret', 'refreshToken']
      const hasRequiredField = requiredFields.some(field => config[field] && config[field].trim() !== '')
      
      if (!hasRequiredField) {
        return { valid: false, message: 'Please provide at least one authentication field' }
      }
      
      return { valid: true, message: 'Configuration is valid' }
    }

    const validation = validateConfig(config)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Update the integration with configuration data
    // Store all config in metadata field as JSON
    const updatedIntegration = await db
      .update(integrations)
      .set({
        accessToken: config.accessToken || config.apiKey || null,
        refreshToken: config.refreshToken || null,
        metadata: config, // Store all configuration including apiKey, accountId, etc.
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integrationId))
      .returning()

    if (updatedIntegration.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      integrationId,
    })
  } catch (error) {
    console.error('Error saving integration configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('id')

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      )
    }

    // Fetch the integration from database
    const integration = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1)

    if (integration.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Return the configuration from metadata field
    // Mask sensitive fields for security
    const config: any = integration[0].metadata || {}
    const maskedConfig = {
      ...config,
      apiKey: config.apiKey ? '********' + config.apiKey.slice(-4) : undefined,
      apiSecret: config.apiSecret ? '********' + config.apiSecret.slice(-4) : undefined,
      accessToken: config.accessToken ? '********' + config.accessToken.slice(-4) : undefined,
      refreshToken: config.refreshToken ? '********' + config.refreshToken.slice(-4) : undefined,
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      integrationId,
    })
  } catch (error) {
    console.error('Error fetching integration configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}