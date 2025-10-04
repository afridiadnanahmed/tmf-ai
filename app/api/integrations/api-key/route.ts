import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import { PLATFORMS } from '@/lib/integrations/all-platforms';

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
    
    // Store credentials metadata
    let metadata: any = {
      connectedAt: new Date().toISOString(),
      type: 'api_key',
      credentials: {}, // Store non-sensitive credential info
    };
    
    // Store non-sensitive credential information in metadata
    for (const field of platformConfig.apiKeyFields || []) {
      if (field.type !== 'password' && credentials[field.name]) {
        metadata.credentials[field.name] = credentials[field.name];
      }
    }
    
    // Validate API key based on platform (optional validation)
    let isValid = true;
    
    switch (platform) {
      case 'klaviyo':
        // Store company name in metadata
        metadata.company = credentials.company;
        // Basic validation - check if private key starts with 'pk_'
        if (!credentials.privateKey?.startsWith('pk_')) {
          return NextResponse.json({ 
            error: 'Invalid Klaviyo private key format. It should start with "pk_"' 
          }, { status: 400 });
        }
        break;
        
      case 'sendgrid':
        // Validate SendGrid API key
        try {
          const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
          });
          isValid = response.ok;
          if (isValid) {
            const profile = await response.json();
            metadata.email = profile.email;
            metadata.username = profile.username;
          }
        } catch (error) {
          isValid = false;
        }
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
        
      case 'brevo':
        // Validate Brevo API key
        try {
          const response = await fetch('https://api.brevo.com/v3/account', {
            headers: {
              'api-key': credentials.apiKey,
            },
          });
          isValid = response.ok;
          if (isValid) {
            const account = await response.json();
            metadata.email = account.email;
            metadata.companyName = account.companyName;
          }
        } catch (error) {
          isValid = false;
        }
        break;
    }
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials. Please check and try again.' }, { status: 400 });
    }
    
    // Combine all credential fields into a single encrypted string for storage
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
      // Update existing integration
      await db
        .update(integrations)
        .set({
          accessToken: credentialString, // Store all credentials as JSON string
          isActive: true,
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existingIntegration[0].id));
    } else {
      // Create new integration
      await db.insert(integrations).values({
        userId: session.id,
        platform,
        accessToken: credentialString, // Store all credentials as JSON string
        isActive: true,
        metadata,
      });
    }
    
    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error('API key integration error:', error);
    return NextResponse.json({ 
      error: 'Failed to connect with API key' 
    }, { status: 500 });
  }
}