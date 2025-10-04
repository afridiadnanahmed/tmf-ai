import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { oauthApps, integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import { encryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

// GET endpoint to fetch OAuth configuration
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    // First, try to get the OAuth app configuration for this user and platform
    const oauthApp = await db
      .select()
      .from(oauthApps)
      .where(
        and(
          eq(oauthApps.userId, session.id),
          eq(oauthApps.platform, platform),
          eq(oauthApps.isActive, true)
        )
      )
      .limit(1);

    if (oauthApp.length > 0) {
      const app = oauthApp[0];
      // Return OAuth app configuration (without the encrypted secret)
      return NextResponse.json({
        id: app.id,
        platform: app.platform,
        clientId: app.clientId,
        // Don't send the actual secret for security
        hasClientSecret: !!app.clientSecret,
        redirectUri: app.redirectUri,
        scopes: app.scopes,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      });
    }

    // If no OAuth app found, check if there's a disconnected integration with saved credentials
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

    if (integration.length > 0 && integration[0].oauthAppId) {
      // Get the OAuth app linked to this integration
      const linkedOauthApp = await db
        .select()
        .from(oauthApps)
        .where(eq(oauthApps.id, integration[0].oauthAppId))
        .limit(1);

      if (linkedOauthApp.length > 0) {
        const app = linkedOauthApp[0];
        return NextResponse.json({
          id: app.id,
          platform: app.platform,
          clientId: app.clientId,
          hasClientSecret: !!app.clientSecret,
          redirectUri: app.redirectUri,
          scopes: app.scopes,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        });
      }
    }

    // No OAuth configuration found
    return NextResponse.json(null);
  } catch (error) {
    console.error('Get OAuth config error:', error);
    return NextResponse.json({
      error: 'Failed to fetch OAuth configuration'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove OAuth configuration
export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await request.json();

    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    // Delete the OAuth app configuration
    await db
      .delete(oauthApps)
      .where(
        and(
          eq(oauthApps.userId, session.id),
          eq(oauthApps.platform, platform)
        )
      );

    // Also remove the oauth app reference from any integrations
    await db
      .update(integrations)
      .set({
        oauthAppId: null,
        isActive: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        metadata: {
          deletedAt: new Date().toISOString(),
          reason: 'OAuth configuration deleted'
        }
      })
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.platform, platform)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete OAuth config error:', error);
    return NextResponse.json({
      error: 'Failed to delete OAuth configuration'
    }, { status: 500 });
  }
}

// PUT endpoint to update OAuth configuration
export async function PUT(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, clientId, clientSecret, redirectUri, scopes } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    // Find existing OAuth app
    const existingApp = await db
      .select()
      .from(oauthApps)
      .where(
        and(
          eq(oauthApps.userId, session.id),
          eq(oauthApps.platform, platform)
        )
      )
      .limit(1);

    if (existingApp.length === 0) {
      return NextResponse.json({ error: 'OAuth configuration not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (clientId) {
      updateData.clientId = clientId;
    }
    if (clientSecret) {
      // Encrypt the client secret before storing
      updateData.clientSecret = encryptSecret(clientSecret);
    }
    if (redirectUri !== undefined) {
      updateData.redirectUri = redirectUri;
    }
    if (scopes !== undefined) {
      updateData.scopes = Array.isArray(scopes) ? scopes : scopes.split(',').map((s: string) => s.trim());
    }

    // Update the OAuth app
    await db
      .update(oauthApps)
      .set(updateData)
      .where(eq(oauthApps.id, existingApp[0].id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update OAuth config error:', error);
    return NextResponse.json({
      error: 'Failed to update OAuth configuration'
    }, { status: 500 });
  }
}