import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { oauthApps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import crypto from 'crypto';

// Encryption helper functions
const algorithm = 'aes-256-gcm';
const getEncryptionKey = () => {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { clientId, clientSecret, redirectUri, scopes, isActive } = await request.json();
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'Client ID is required' 
      }, { status: 400 });
    }
    
    // Verify ownership
    const existingApp = await db
      .select()
      .from(oauthApps)
      .where(
        and(
          eq(oauthApps.id, params.id),
          eq(oauthApps.userId, session.id)
        )
      )
      .limit(1);
    
    if (existingApp.length === 0) {
      return NextResponse.json({ error: 'OAuth app not found' }, { status: 404 });
    }
    
    // Encrypt client secret if provided
    const updateData: any = {
      clientId,
      redirectUri: redirectUri || null,
      scopes: scopes || [],
      updatedAt: new Date(),
    };
    
    if (clientSecret) {
      updateData.clientSecret = encrypt(clientSecret);
    }
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    await db
      .update(oauthApps)
      .set(updateData)
      .where(eq(oauthApps.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update OAuth app error:', error);
    return NextResponse.json({ 
      error: 'Failed to update OAuth app' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership before deleting
    const existingApp = await db
      .select()
      .from(oauthApps)
      .where(
        and(
          eq(oauthApps.id, params.id),
          eq(oauthApps.userId, session.id)
        )
      )
      .limit(1);
    
    if (existingApp.length === 0) {
      return NextResponse.json({ error: 'OAuth app not found' }, { status: 404 });
    }
    
    await db
      .delete(oauthApps)
      .where(eq(oauthApps.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete OAuth app error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete OAuth app' 
    }, { status: 500 });
  }
}