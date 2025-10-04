import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, oauthApps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import { PLATFORMS } from '@/lib/integrations/all-platforms';

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all user integrations
    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, session.id));
    
    // Get user's configured OAuth apps
    const userOAuthApps = await db
      .select()
      .from(oauthApps)
      .where(
        and(
          eq(oauthApps.userId, session.id),
          eq(oauthApps.isActive, true)
        )
      );
    
    // Show ALL platforms (users can configure OAuth apps for any platform)
    // In a dynamic OAuth system, all platforms are available for configuration
    const integrationStatus = PLATFORMS.map(platform => {
      const integration = userIntegrations.find(i => i.platform === platform.id);
      const hasOAuthApp = userOAuthApps.find(app => app.platform === platform.id);

      return {
        id: platform.id,
        name: platform.name,
        description: platform.description,
        icon: platform.icon,
        iconColor: platform.iconColor,
        bgColor: platform.bgColor,
        category: platform.category,
        requiresOAuth: platform.requiresOAuth,
        requiresApiKey: platform.requiresApiKey,
        apiKeyFields: platform.apiKeyFields,
        hasOAuthConfigured: !!hasOAuthApp, // Indicates if user has configured OAuth app
        status: integration?.isActive ? 'connected' : 'disconnected',
        connectedAt: integration?.metadata ? (integration.metadata as any).connectedAt : null,
        expiresAt: integration?.expiresAt,
        needsRefresh: integration?.expiresAt ? new Date(integration.expiresAt) < new Date() : false,
      };
    });
    
    return NextResponse.json({ integrations: integrationStatus });
  } catch (error) {
    console.error('Get integration status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get integration status' 
    }, { status: 500 });
  }
}