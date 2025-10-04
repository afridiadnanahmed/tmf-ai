import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

async function sendFacebookMessage(
  accessToken: string,
  conversationId: string,
  message: string
): Promise<boolean> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('fb_')
      ? conversationId.slice(3)
      : conversationId;

    // Send message to the conversation
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${actualConvId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send Facebook message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Facebook message:', error);
    return false;
  }
}

async function sendInstagramMessage(
  accessToken: string,
  conversationId: string,
  message: string
): Promise<boolean> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('ig_')
      ? conversationId.slice(3)
      : conversationId;

    // Send message to the conversation
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${actualConvId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send Instagram message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Instagram message:', error);
    return false;
  }
}

async function sendTwitterDM(
  accessToken: string,
  conversationId: string,
  message: string
): Promise<boolean> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('tw_')
      ? conversationId.slice(3)
      : conversationId;

    // Send DM
    const response = await fetch(
      'https://api.twitter.com/2/dm_conversations/with/:participant_id/messages',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dm_conversation_id: actualConvId,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send Twitter DM:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Twitter DM:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, platform, content } = await request.json();

    if (!conversationId || !platform || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the integration for this platform
    const integration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.platform, platform),
          eq(integrations.status, 'connected')
        )
      )
      .limit(1);

    if (integration.length === 0 || !integration[0].accessToken) {
      return NextResponse.json(
        { error: 'Platform not connected' },
        { status: 400 }
      );
    }

    const accessToken = decryptSecret(integration[0].accessToken);
    let success = false;

    switch (platform) {
      case 'facebook':
        success = await sendFacebookMessage(accessToken, conversationId, content);
        break;

      case 'instagram':
        success = await sendInstagramMessage(accessToken, conversationId, content);
        break;

      case 'twitter':
        success = await sendTwitterDM(accessToken, conversationId, content);
        break;

      case 'linkedin':
        // LinkedIn messaging requires special partner access
        console.log('LinkedIn messaging requires special partner access');
        return NextResponse.json(
          { error: 'LinkedIn messaging not available' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}