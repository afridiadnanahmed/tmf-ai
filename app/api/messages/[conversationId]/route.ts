import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    type: 'image' | 'file' | 'video';
    url: string;
    name: string;
  }>;
}

async function fetchFacebookMessages(
  accessToken: string,
  conversationId: string
): Promise<Message[]> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('fb_')
      ? conversationId.slice(3)
      : conversationId;

    // Fetch messages from the conversation
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${actualConvId}/messages?fields=id,created_time,from,message,attachments&limit=50&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error('Failed to fetch Facebook messages');
      return [];
    }

    const data = await response.json();
    const messages: Message[] = [];

    // Get page ID to determine if message is from page (own)
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    const meData = await meResponse.json();
    const pageId = meData.id;

    for (const msg of data.data || []) {
      const isOwn = msg.from?.id === pageId;

      messages.push({
        id: msg.id,
        conversationId: conversationId,
        senderId: msg.from?.id || 'unknown',
        senderName: msg.from?.name || (isOwn ? 'You' : 'User'),
        content: msg.message || '',
        timestamp: new Date(msg.created_time),
        isOwn: isOwn,
        status: isOwn ? 'read' : undefined,
        attachments: msg.attachments?.data?.map((att: any) => ({
          type: att.mime_type?.includes('image') ? 'image' :
                att.mime_type?.includes('video') ? 'video' : 'file',
          url: att.image_src || att.video_src || att.file_url || '',
          name: att.name || 'attachment'
        }))
      });
    }

    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return messages;
  } catch (error) {
    console.error('Error fetching Facebook messages:', error);
    return [];
  }
}

async function fetchInstagramMessages(
  accessToken: string,
  conversationId: string
): Promise<Message[]> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('ig_')
      ? conversationId.slice(3)
      : conversationId;

    // Get Instagram Business Account ID
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=instagram_business_account&access_token=${accessToken}`
    );

    if (!accountResponse.ok) {
      console.error('Failed to fetch Instagram account');
      return [];
    }

    const accountData = await accountResponse.json();
    const igBusinessId = accountData.instagram_business_account?.id;

    if (!igBusinessId) {
      console.error('No Instagram Business Account found');
      return [];
    }

    // Fetch messages from the conversation
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${actualConvId}/messages?fields=id,created_time,from,message,attachments&limit=50&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error('Failed to fetch Instagram messages');
      return [];
    }

    const data = await response.json();
    const messages: Message[] = [];

    for (const msg of data.data || []) {
      const isOwn = msg.from?.id === igBusinessId;

      messages.push({
        id: msg.id,
        conversationId: conversationId,
        senderId: msg.from?.id || 'unknown',
        senderName: msg.from?.username || msg.from?.name || (isOwn ? 'You' : 'User'),
        content: msg.message || '',
        timestamp: new Date(msg.created_time),
        isOwn: isOwn,
        status: isOwn ? 'read' : undefined,
        attachments: msg.attachments?.data?.map((att: any) => ({
          type: att.type === 'IMAGE' ? 'image' :
                att.type === 'VIDEO' ? 'video' : 'file',
          url: att.url || '',
          name: att.name || 'attachment'
        }))
      });
    }

    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return messages;
  } catch (error) {
    console.error('Error fetching Instagram messages:', error);
    return [];
  }
}

async function fetchTwitterMessages(
  accessToken: string,
  conversationId: string
): Promise<Message[]> {
  try {
    // Remove prefix if present
    const actualConvId = conversationId.startsWith('tw_')
      ? conversationId.slice(3)
      : conversationId;

    // Fetch DM events for the conversation
    const response = await fetch(
      `https://api.twitter.com/2/dm_conversations/${actualConvId}/dm_events?max_results=50&dm_event.fields=created_at,sender_id,text,attachments&expansions=sender_id&user.fields=name,username,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch Twitter messages');
      return [];
    }

    const data = await response.json();
    const messages: Message[] = [];

    // Get authenticated user ID
    const meResponse = await fetch(
      'https://api.twitter.com/2/users/me',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    const meData = await meResponse.json();
    const myUserId = meData.data?.id;

    // Create user map from includes
    const userMap = new Map();
    data.includes?.users?.forEach((user: any) => {
      userMap.set(user.id, user);
    });

    for (const event of data.data || []) {
      const sender = userMap.get(event.sender_id);
      const isOwn = event.sender_id === myUserId;

      messages.push({
        id: event.id,
        conversationId: conversationId,
        senderId: event.sender_id,
        senderName: sender?.name || sender?.username || (isOwn ? 'You' : 'User'),
        content: event.text || '',
        timestamp: new Date(event.created_at),
        isOwn: isOwn,
        status: isOwn ? 'sent' : undefined,
        attachments: event.attachments?.media_keys?.map((key: string) => ({
          type: 'image', // Twitter API v2 requires additional calls for media details
          url: `https://twitter.com/messages/media/${key}`,
          name: 'attachment'
        }))
      });
    }

    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return messages;
  } catch (error) {
    console.error('Error fetching Twitter messages:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.conversationId;

    // Extract platform from conversation ID
    let platform = '';
    if (conversationId.startsWith('fb_')) platform = 'facebook';
    else if (conversationId.startsWith('ig_')) platform = 'instagram';
    else if (conversationId.startsWith('tw_')) platform = 'twitter';
    else if (conversationId.startsWith('li_')) platform = 'linkedin';

    if (!platform) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
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
    let messages: Message[] = [];

    switch (platform) {
      case 'facebook':
        messages = await fetchFacebookMessages(accessToken, conversationId);
        break;

      case 'instagram':
        messages = await fetchInstagramMessages(accessToken, conversationId);
        break;

      case 'twitter':
        messages = await fetchTwitterMessages(accessToken, conversationId);
        break;

      // LinkedIn messaging requires special partner access
      case 'linkedin':
        console.log('LinkedIn messaging requires special partner access');
        break;
    }

    return NextResponse.json({
      messages: messages,
      success: true
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}