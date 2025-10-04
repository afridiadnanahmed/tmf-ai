import { NextRequest, NextResponse } from 'next/server';
import { decryptOAuthState, exchangeCodeForTokens } from '@/lib/integrations/dynamic-oauth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // The dashboard page with integrations tab
  const dashboardUrl = `${baseUrl}/dashboard`;

  try {
    console.log('OAuth callback started');

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Callback params:', {
      hasCode: !!code,
      hasState: !!state,
      error
    });

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      return NextResponse.redirect(
        `${dashboardUrl}?tab=integrations&error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${dashboardUrl}?tab=integrations&error=Missing+authorization+code`
      );
    }

    // Decrypt and validate state
    console.log('Decrypting state...');
    const stateData = decryptOAuthState(state);
    if (!stateData) {
      console.error('Failed to decrypt state');
      return NextResponse.redirect(
        `${dashboardUrl}?tab=integrations&error=Invalid+state+parameter`
      );
    }

    const { userId, platform, oauthAppId, codeVerifier } = stateData;
    console.log('State data:', { userId, platform, oauthAppId, hasCodeVerifier: !!codeVerifier });
    
    // Exchange code for tokens using user's OAuth app credentials
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;
    console.log('Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(
      oauthAppId,
      platform,
      code,
      redirectUri,
      codeVerifier // For PKCE (Twitter)
    );

    if (!tokens) {
      console.error('Failed to exchange code for tokens');
      return NextResponse.redirect(
        `${dashboardUrl}?tab=integrations&error=Failed+to+exchange+authorization+code`
      );
    }

    console.log('Tokens received successfully');
    
    // Calculate token expiration time
    const expiresAt = tokens.expiresIn 
      ? new Date(Date.now() + (tokens.expiresIn * 1000))
      : null;
    
    // Check if integration already exists
    const existingIntegration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.platform, platform)
        )
      )
      .limit(1);
    
    if (existingIntegration.length > 0) {
      // Update existing integration
      await db
        .update(integrations)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || existingIntegration[0].refreshToken,
          expiresAt,
          isActive: true,
          oauthAppId, // Link to the OAuth app used
          metadata: {
            tokenType: tokens.tokenType,
            scope: tokens.scope,
            connectedAt: new Date().toISOString(),
            type: 'oauth',
          },
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existingIntegration[0].id));
    } else {
      // Create new integration
      await db.insert(integrations).values({
        userId,
        platform,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        isActive: true,
        oauthAppId, // Link to the OAuth app used
        metadata: {
          tokenType: tokens.tokenType,
          scope: tokens.scope,
          connectedAt: new Date().toISOString(),
          type: 'oauth',
        },
      });
    }
    
    // Redirect back to integrations tab with success message
    return NextResponse.redirect(
      `${dashboardUrl}?tab=integrations&success=${platform}+connected+successfully`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.redirect(
      `${dashboardUrl}?tab=integrations&error=Connection+failed`
    );
  }
}