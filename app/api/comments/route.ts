import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

interface Comment {
  id: string;
  platform: string;
  postId: string;
  postContent?: string;
  authorName: string;
  authorId: string;
  content: string;
  timestamp: Date;
  avatar?: string;
  replies?: Comment[];
  postUrl?: string;
}

async function fetchFacebookComments(accessToken: string): Promise<Comment[]> {
  try {
    // Get Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error('Failed to fetch Facebook pages');
      return [];
    }

    const pagesData = await pagesResponse.json();
    const comments: Comment[] = [];

    // For each page, get recent posts and their comments
    for (const page of pagesData.data || []) {
      const pageAccessToken = page.access_token;
      const pageId = page.id;

      // Get recent posts
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,permalink_url,comments.limit(10){id,message,created_time,from}&limit=10&access_token=${pageAccessToken}`
      );

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();

        for (const post of postsData.data || []) {
          if (post.comments?.data) {
            for (const comment of post.comments.data) {
              comments.push({
                id: comment.id,
                platform: 'facebook',
                postId: post.id,
                postContent: post.message?.substring(0, 100),
                authorName: comment.from?.name || 'Facebook User',
                authorId: comment.from?.id || '',
                content: comment.message || '',
                timestamp: new Date(comment.created_time),
                avatar: comment.from?.id
                  ? `https://graph.facebook.com/${comment.from.id}/picture?type=normal`
                  : undefined,
                postUrl: post.permalink_url,
              });
            }
          }
        }
      }
    }

    return comments;
  } catch (error) {
    console.error('Error fetching Facebook comments:', error);
    return [];
  }
}

async function fetchInstagramComments(accessToken: string): Promise<Comment[]> {
  try {
    // Get Instagram Business Account
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

    // Get recent media
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,comments.limit(10){id,text,username,timestamp}&limit=10&access_token=${accessToken}`
    );

    if (!mediaResponse.ok) {
      console.error('Failed to fetch Instagram media');
      return [];
    }

    const mediaData = await mediaResponse.json();
    const comments: Comment[] = [];

    for (const media of mediaData.data || []) {
      if (media.comments?.data) {
        for (const comment of media.comments.data) {
          comments.push({
            id: comment.id,
            platform: 'instagram',
            postId: media.id,
            postContent: media.caption?.substring(0, 100),
            authorName: comment.username || 'Instagram User',
            authorId: comment.id,
            content: comment.text || '',
            timestamp: new Date(comment.timestamp),
            postUrl: media.permalink,
          });
        }
      }
    }

    return comments;
  } catch (error) {
    console.error('Error fetching Instagram comments:', error);
    return [];
  }
}

async function fetchTwitterMentions(accessToken: string): Promise<Comment[]> {
  try {
    // Get authenticated user
    const meResponse = await fetch(
      'https://api.twitter.com/2/users/me',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!meResponse.ok) {
      console.error('Failed to fetch Twitter user');
      return [];
    }

    const meData = await meResponse.json();
    const userId = meData.data?.id;

    if (!userId) {
      return [];
    }

    // Fetch mentions
    const mentionsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/mentions?tweet.fields=created_at,author_id,conversation_id&expansions=author_id&user.fields=name,username,profile_image_url&max_results=20`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!mentionsResponse.ok) {
      console.error('Failed to fetch Twitter mentions');
      return [];
    }

    const mentionsData = await mentionsResponse.json();
    const comments: Comment[] = [];

    // Create user map
    const userMap = new Map();
    mentionsData.includes?.users?.forEach((user: any) => {
      userMap.set(user.id, user);
    });

    for (const tweet of mentionsData.data || []) {
      const author = userMap.get(tweet.author_id);

      comments.push({
        id: tweet.id,
        platform: 'twitter',
        postId: tweet.conversation_id || tweet.id,
        authorName: author?.name || author?.username || 'Twitter User',
        authorId: tweet.author_id,
        content: tweet.text || '',
        timestamp: new Date(tweet.created_at),
        avatar: author?.profile_image_url,
        postUrl: `https://twitter.com/i/web/status/${tweet.id}`,
      });
    }

    return comments;
  } catch (error) {
    console.error('Error fetching Twitter mentions:', error);
    return [];
  }
}

async function fetchLinkedInComments(accessToken: string): Promise<Comment[]> {
  try {
    // LinkedIn's API for fetching post comments is restricted
    // This would require special partner access
    console.log('LinkedIn comment API requires special partner access');
    return [];
  } catch (error) {
    console.error('Error fetching LinkedIn comments:', error);
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

    // Get all connected integrations
    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.status, 'connected')
        )
      );

    const allComments: Comment[] = [];

    // Fetch comments from each connected platform
    for (const integration of userIntegrations) {
      if (!integration.accessToken) continue;

      const accessToken = decryptSecret(integration.accessToken);

      switch (integration.platform) {
        case 'facebook':
          const fbComments = await fetchFacebookComments(accessToken);
          allComments.push(...fbComments);
          break;

        case 'instagram':
          const igComments = await fetchInstagramComments(accessToken);
          allComments.push(...igComments);
          break;

        case 'twitter':
          const twMentions = await fetchTwitterMentions(accessToken);
          allComments.push(...twMentions);
          break;

        case 'linkedin':
          const liComments = await fetchLinkedInComments(accessToken);
          allComments.push(...liComments);
          break;
      }
    }

    // Sort comments by timestamp (newest first)
    allComments.sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return NextResponse.json({
      comments: allComments,
      success: true
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}