import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import { PLATFORMS } from '@/lib/integrations/all-platforms';

// Save API key configuration without activating the integration
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, credentials } = await request.json();

    // Validate platform
    const platformConfig = PLATFORMS.find(p => p.id === platform);
    if (!platformConfig) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Check if platform uses API keys
    if (!platformConfig.requiresApiKey) {
      return NextResponse.json({
        error: 'Platform does not use API key authentication'
      }, { status: 400 });
    }

    // Validate required fields
    const missingFields = platformConfig.apiKeyFields?.filter(
      field => field.required && !credentials[field.name]
    );

    if (missingFields && missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}`
      }, { status: 400 });
    }

    // Store credentials metadata (non-sensitive info for display)
    let metadata: any = {
      configuredAt: new Date().toISOString(),
      type: 'api_key',
      credentials: {},
    };

    // Store non-sensitive credential information in metadata
    for (const field of platformConfig.apiKeyFields || []) {
      if (field.type !== 'password' && credentials[field.name]) {
        metadata.credentials[field.name] = credentials[field.name];
      }
    }

    // Platform-specific metadata
    switch (platform) {
      case 'klaviyo':
        metadata.company = credentials.company;
        break;
      case 'shopify':
        metadata.storeName = credentials.storeName;
        break;
      case 'stripe':
        metadata.environment = credentials.environment;
        break;
      case 'twilio':
        metadata.accountSid = credentials.accountSid;
        break;
      case 'mixpanel':
        metadata.projectId = credentials.projectId;
        break;
      case 'hotjar':
        metadata.siteId = credentials.siteId;
        break;
    }

    // Combine all credential fields into a single string for storage
    const credentialString = JSON.stringify(credentials);

    // Check if integration already exists
    const existingIntegration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.platform, platform)
        )
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      // Update existing integration - keep isActive as false (configured but not connected)
      await db
        .update(integrations)
        .set({
          accessToken: credentialString,
          isActive: false, // NOT active - just configured
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existingIntegration[0].id));
    } else {
      // Create new integration - NOT active
      await db.insert(integrations).values({
        userId: session.id,
        platform,
        accessToken: credentialString,
        isActive: false, // NOT active - just configured
        metadata,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved. You can now connect to verify credentials.',
      metadata
    });
  } catch (error) {
    console.error('API key config save error:', error);
    return NextResponse.json({
      error: 'Failed to save configuration'
    }, { status: 500 });
  }
}
