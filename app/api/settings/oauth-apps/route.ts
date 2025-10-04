import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { oauthApps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import crypto from 'crypto';

// Encryption helper functions
const algorithm = 'aes-256-gcm';
const getEncryptionKey = () => {
  // In production, use a proper key management service
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  return crypto.createHash('sha256').update(key).digest();
};

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

const decrypt = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const apps = await db
      .select()
      .from(oauthApps)
      .where(eq(oauthApps.userId, session.id));
    
    // Decrypt client secrets before sending
    const decryptedApps = apps.map(app => ({
      ...app,
      clientSecret: app.clientSecret ? decrypt(app.clientSecret) : null,
    }));
    
    return NextResponse.json({ apps: decryptedApps });
  } catch (error) {
    console.error('Get OAuth apps error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch OAuth apps' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { platform, clientId, clientSecret, redirectUri, scopes } = await request.json();
    
    if (!platform || !clientId) {
      return NextResponse.json({ 
        error: 'Platform and Client ID are required' 
      }, { status: 400 });
    }
    
    // Check if app already exists for this platform
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
    
    if (existingApp.length > 0) {
      return NextResponse.json({ 
        error: 'OAuth app already exists for this platform' 
      }, { status: 400 });
    }
    
    // Encrypt client secret before storing
    const encryptedSecret = clientSecret ? encrypt(clientSecret) : null;

    // Always use default redirect URI to ensure consistency
    const defaultRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;

    const [newApp] = await db.insert(oauthApps).values({
      userId: session.id,
      platform,
      clientId,
      clientSecret: encryptedSecret,
      redirectUri: defaultRedirectUri, // Always use default to prevent null values
      scopes: scopes || [],
      isActive: true,
    }).returning();
    
    return NextResponse.json({ 
      success: true,
      app: {
        ...newApp,
        clientSecret: clientSecret ? '••••••••' : null, // Don't send back the actual secret
      }
    });
  } catch (error) {
    console.error('Create OAuth app error:', error);
    return NextResponse.json({ 
      error: 'Failed to create OAuth app' 
    }, { status: 500 });
  }
}