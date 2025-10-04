import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Platform configurations
const PLATFORM_CONFIGS = {
  metaAds: {
    name: 'Meta Ads',
    description: 'Connect your Meta (Facebook) Ads account to track campaign performance and optimize spending',
    icon: '∞',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  googleAds: {
    name: 'Google Ads',
    description: 'Connect your Google Ads account to track campaign performance and optimize spending',
    icon: '△',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  googleAnalytics: {
    name: 'Google Analytics',
    description: 'Track website traffic, user behavior, and conversion metrics with Google Analytics',
    icon: '📊',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  tikTok: {
    name: 'TikTok',
    description: 'Manage your TikTok advertising campaigns and track performance metrics',
    icon: '🎵',
    iconColor: 'text-black',
    bgColor: 'bg-gray-100',
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'Connect LinkedIn to manage professional network campaigns and B2B marketing',
    icon: '💼',
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  youtube: {
    name: 'YouTube',
    description: 'Manage YouTube advertising and track video campaign performance',
    icon: '📺',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  hotjar: {
    name: 'Hotjar',
    description: 'Understand user behavior with heatmaps and session recordings',
    icon: '🔥',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Manage email campaigns and track delivery metrics',
    icon: '📧',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  brevo: {
    name: 'Brevo',
    description: 'All-in-one marketing platform for email, SMS, and chat',
    icon: '🟢',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  mailchimp: {
    name: 'Mailchimp',
    description: 'Email marketing automation and audience management',
    icon: '🐵',
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  hubspot: {
    name: 'HubSpot',
    description: 'Inbound marketing, sales, and customer service platform',
    icon: '🔶',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  magento: {
    name: 'Magento',
    description: 'E-commerce platform integration for online stores',
    icon: '🛒',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
};

// Get user's integrations
export async function GET(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get user's integrations from database
    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, session.userId));

    // Format integrations with platform configs
    const formattedIntegrations = userIntegrations.map(integration => {
      // Check if configuration exists (has metadata with required fields)
      const metadata = integration.metadata as any || {};
      const isConfigured = !!(
        metadata.apiKey || 
        metadata.apiSecret || 
        metadata.accessToken || 
        metadata.accountId ||
        integration.accessToken
      );
      
      return {
        id: integration.id,
        platform: integration.platform,
        isActive: integration.isActive,
        isConfigured,
        createdAt: integration.createdAt,
        ...PLATFORM_CONFIGS[integration.platform as keyof typeof PLATFORM_CONFIGS],
        status: 'Connected',
      };
    });

    // Get all available platforms
    const connectedPlatforms = userIntegrations.map(i => i.platform);
    const availablePlatforms = Object.entries(PLATFORM_CONFIGS)
      .filter(([key]) => !connectedPlatforms.includes(key))
      .map(([platform, config]) => ({
        platform,
        ...config,
        status: 'Disconnected',
      }));

    return NextResponse.json({
      connected: formattedIntegrations,
      available: availablePlatforms,
    });

  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to get integrations' },
      { status: 500 }
    );
  }
}

// Add a new integration
export async function POST(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { platform } = body;

    if (!platform || !PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Check if integration already exists
    const existing = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.userId),
          eq(integrations.platform, platform)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Integration already exists' },
        { status: 400 }
      );
    }

    // Create new integration
    const newIntegration = await db
      .insert(integrations)
      .values({
        userId: session.userId,
        platform,
        isActive: true,
        metadata: {
          addedAt: new Date().toISOString(),
          // In real app, this would store OAuth tokens, API keys, etc.
        },
      })
      .returning();

    return NextResponse.json({
      integration: {
        ...newIntegration[0],
        ...PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS],
      },
      message: 'Integration added successfully',
    });

  } catch (error) {
    console.error('Add integration error:', error);
    return NextResponse.json(
      { error: 'Failed to add integration' },
      { status: 500 }
    );
  }
}

// Update integration (toggle active/inactive)
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { integrationId, isActive } = body;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Update integration
    const updated = await db
      .update(integrations)
      .set({
        isActive: isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, session.userId)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      integration: updated[0],
      message: `Integration ${isActive ? 'activated' : 'deactivated'} successfully`,
    });

  } catch (error) {
    console.error('Update integration error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// Delete integration
export async function DELETE(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get integration ID from query params
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Delete integration
    const deleted = await db
      .delete(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, session.userId)
        )
      )
      .returning();

    if (!deleted.length) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Integration removed successfully',
    });

  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}