import { NextRequest, NextResponse } from 'next/server';
import { generateAuthorizationUrl } from '@/lib/integrations/dynamic-oauth-utils';
import { PLATFORMS } from '@/lib/integrations/all-platforms';
import { getServerSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { platform } = await request.json();
    
    // Validate platform
    const platformConfig = PLATFORMS.find(p => p.id === platform);
    if (!platformConfig) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }
    
    // Check if platform requires OAuth
    if (!platformConfig.requiresOAuth) {
      return NextResponse.json({ 
        error: 'Platform does not require OAuth. Use API key instead.' 
      }, { status: 400 });
    }
    
    // Generate redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;
    
    // Generate authorization URL with user's OAuth app credentials
    const authData = await generateAuthorizationUrl(session.id, platform, redirectUri);
    
    if (!authData) {
      return NextResponse.json({ 
        error: 'No OAuth app configured for this platform. Please configure it in settings first.',
        requiresConfiguration: true 
      }, { status: 400 });
    }
    
    return NextResponse.json({ authUrl: authData.authUrl });
  } catch (error) {
    console.error('OAuth connect error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate OAuth connection' 
    }, { status: 500 });
  }
}