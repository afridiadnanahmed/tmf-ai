import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptSecret } from '@/lib/integrations/dynamic-oauth-utils';

async function replyToFacebookComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<boolean> {
  try {
    // Reply to the comment
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/comments`,
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
      console.error('Failed to reply to Facebook comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error replying to Facebook comment:', error);
    return false;
  }
}

async function replyToInstagramComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<boolean> {
  try {
    // Reply to Instagram comment
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/replies`,
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
      console.error('Failed to reply to Instagram comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error replying to Instagram comment:', error);
    return false;
  }
}

async function replyToTwitterMention(
  accessToken: string,
  tweetId: string,
  message: string
): Promise<boolean> {
  try {
    // Reply to tweet
    const response = await fetch(
      'https://api.twitter.com/2/tweets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to reply to Twitter mention:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error replying to Twitter mention:', error);
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

    const { commentId, platform, content } = await request.json();

    if (!commentId || !platform || !content) {
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
        success = await replyToFacebookComment(accessToken, commentId, content);
        break;

      case 'instagram':
        success = await replyToInstagramComment(accessToken, commentId, content);
        break;

      case 'twitter':
        success = await replyToTwitterMention(accessToken, commentId, content);
        break;

      case 'linkedin':
        // LinkedIn comment API requires special partner access
        console.log('LinkedIn comment API requires special partner access');
        return NextResponse.json(
          { error: 'LinkedIn commenting not available' },
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
        { error: 'Failed to reply to comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully'
    });

  } catch (error) {
    console.error('Error replying to comment:', error);
    return NextResponse.json(
      { error: 'Failed to reply to comment' },
      { status: 500 }
    );
  }
}