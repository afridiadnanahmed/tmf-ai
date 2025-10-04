import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

interface Conversation {
  id: string;
  contactName: string;
  contactId: string;
  platform: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  phoneNumber?: string;
  email?: string;
}

async function fetchFacebookConversations(accessToken: string): Promise<Conversation[]> {
  try {
    // Get Facebook pages first
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error('Failed to fetch Facebook pages');
      return [];
    }

    const pagesData = await pagesResponse.json();
    const conversations: Conversation[] = [];

    // For each page, get conversations
    for (const page of pagesData.data || []) {
      const pageAccessToken = page.access_token;
      const pageId = page.id;

      // Fetch conversations for this page
      const conversationsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=participants,updated_time,unread_count,messages.limit(1){message,created_time,from}&access_token=${pageAccessToken}`
      );

      if (conversationsResponse.ok) {
        const convData = await conversationsResponse.json();

        for (const conv of convData.data || []) {
          const participant = conv.participants?.data?.find((p: any) => p.id !== pageId);
          const lastMsg = conv.messages?.data?.[0];

          if (participant && lastMsg) {
            conversations.push({
              id: `fb_${conv.id}`,
              contactName: participant.name || 'Unknown User',
              contactId: participant.id,
              platform: 'facebook',
              lastMessage: lastMsg.message || '',
              lastMessageTime: new Date(lastMsg.created_time),
              unreadCount: conv.unread_count || 0,
              avatar: `https://graph.facebook.com/${participant.id}/picture?type=normal`,
            });
          }
        }
      }
    }

    return conversations;
  } catch (error) {
    console.error('Error fetching Facebook conversations:', error);
    return [];
  }
}

async function fetchInstagramConversations(accessToken: string): Promise<Conversation[]> {
  try {
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

    // Fetch conversations
    const conversationsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessId}/conversations?fields=participants,updated_time,messages.limit(1){message,created_time,from}&access_token=${accessToken}`
    );

    if (!conversationsResponse.ok) {
      console.error('Failed to fetch Instagram conversations');
      return [];
    }

    const convData = await conversationsResponse.json();
    const conversations: Conversation[] = [];

    for (const conv of convData.data || []) {
      const participant = conv.participants?.data?.find((p: any) => p.id !== igBusinessId);
      const lastMsg = conv.messages?.data?.[0];

      if (participant && lastMsg) {
        conversations.push({
          id: `ig_${conv.id}`,
          contactName: participant.username || participant.name || 'Unknown User',
          contactId: participant.id,
          platform: 'instagram',
          lastMessage: lastMsg.message || '',
          lastMessageTime: new Date(lastMsg.created_time),
          unreadCount: 0, // Instagram API doesn't provide unread count
          avatar: participant.profile_pic,
        });
      }
    }

    return conversations;
  } catch (error) {
    console.error('Error fetching Instagram conversations:', error);
    return [];
  }
}

async function fetchLinkedInConversations(accessToken: string): Promise<Conversation[]> {
  try {
    // LinkedIn messaging requires special permissions
    // This is a simplified version - actual implementation would need more complex API calls
    const conversations: Conversation[] = [];

    // Note: LinkedIn's messaging API is restricted and requires special partner access
    // This would need to be implemented with LinkedIn's restricted messaging API
    console.log('LinkedIn messaging API requires special partner access');

    return conversations;
  } catch (error) {
    console.error('Error fetching LinkedIn conversations:', error);
    return [];
  }
}

async function fetchTwitterConversations(accessToken: string): Promise<Conversation[]> {
  try {
    // Fetch Twitter DMs
    const response = await fetch(
      'https://api.twitter.com/2/dm_conversations?dm_event.fields=created_at,sender_id,text&expansions=sender_id,referenced_tweet.id&user.fields=name,profile_image_url',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch Twitter conversations');
      return [];
    }

    const data = await response.json();
    const conversations: Conversation[] = [];

    // Process Twitter DM conversations
    for (const conv of data.data || []) {
      // Twitter API v2 structure would need proper parsing
      // This is a simplified version
      conversations.push({
        id: `tw_${conv.id}`,
        contactName: conv.name || 'Twitter User',
        contactId: conv.id,
        platform: 'twitter',
        lastMessage: conv.text || '',
        lastMessageTime: new Date(conv.created_at),
        unreadCount: 0,
        avatar: conv.profile_image_url,
      });
    }

    return conversations;
  } catch (error) {
    console.error('Error fetching Twitter conversations:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all connected integrations for the user
    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.status, 'connected')
        )
      );

    const allConversations: Conversation[] = [];

    // Fetch conversations from each connected platform
    for (const integration of userIntegrations) {
      if (!integration.accessToken) continue;

      const accessToken = decryptSecret(integration.accessToken);

      switch (integration.platform) {
        case 'facebook':
          const fbConversations = await fetchFacebookConversations(accessToken);
          allConversations.push(...fbConversations);
          break;

        case 'instagram':
          const igConversations = await fetchInstagramConversations(accessToken);
          allConversations.push(...igConversations);
          break;

        case 'linkedin':
          const liConversations = await fetchLinkedInConversations(accessToken);
          allConversations.push(...liConversations);
          break;

        case 'twitter':
          const twConversations = await fetchTwitterConversations(accessToken);
          allConversations.push(...twConversations);
          break;

        // Add more platforms as needed
      }
    }

    // Sort conversations by last message time
    allConversations.sort((a, b) =>
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    return NextResponse.json({
      conversations: allConversations,
      success: true
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}