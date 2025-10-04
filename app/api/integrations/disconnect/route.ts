import { NextRequest, NextResponse } from 'next/server';
import { revokeTokens } from '@/lib/integrations/oauth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { platform } = await request.json();
    
    // Get integration from database
    const integration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.platform, platform)
        )
      )
      .limit(1);
    
    if (integration.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }
    
    const integrationData = integration[0];
    
    // Revoke tokens if OAuth platform
    if (integrationData.accessToken) {
      await revokeTokens(
        platform,
        integrationData.accessToken
      );
    }
    
    // Update integration status - keep credentials but mark as inactive
    await db
      .update(integrations)
      .set({
        isActive: false,
        // Keep accessToken, refreshToken, expiresAt, and oauthAppId intact
        // This allows for easy reconnection without reconfiguration
        metadata: {
          ...((integrationData.metadata as any) || {}),
          disconnectedAt: new Date().toISOString(),
          disconnectedManually: true, // Flag to indicate manual disconnect
        },
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integrationData.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect integration' 
    }, { status: 500 });
  }
}