// Post publisher service for automatic posting

import { db } from '@/lib/db';
import { posts, integrations } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { postToPlatform } from './platform-clients';

interface PublishResult {
  postId: string;
  success: boolean;
  platformPostId?: string;
  error?: string;
}

export async function publishScheduledPosts(): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  try {
    // Find all scheduled posts that should be published now
    const now = new Date();
    const scheduledPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, 'scheduled'),
          lte(posts.scheduledAt, now)
        )
      );

    console.log(`Found ${scheduledPosts.length} posts ready to publish`);

    // Process each post
    for (const post of scheduledPosts) {
      try {
        if (!post.platform) {
          results.push({
            postId: post.id,
            success: false,
            error: 'No platform specified',
          });
          continue;
        }

        // Get the user's integration for this platform
        const userIntegration = await db
          .select()
          .from(integrations)
          .where(
            and(
              eq(integrations.userId, post.userId),
              eq(integrations.platform, post.platform),
              eq(integrations.isActive, true)
            )
          )
          .limit(1);

        if (!userIntegration || userIntegration.length === 0) {
          results.push({
            postId: post.id,
            success: false,
            error: `No active integration found for platform: ${post.platform}`,
          });

          // Update post status to failed
          await db
            .update(posts)
            .set({
              status: 'failed',
              metadata: {
                error: `No active integration found for platform: ${post.platform}`,
                failedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));

          continue;
        }

        const integration = userIntegration[0];

        if (!integration.accessToken) {
          results.push({
            postId: post.id,
            success: false,
            error: 'No access token available',
          });

          await db
            .update(posts)
            .set({
              status: 'failed',
              metadata: {
                error: 'No access token available',
                failedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));

          continue;
        }

        // Post to the platform (platform client will handle local vs remote images)
        const result = await postToPlatform(post.platform, {
          content: post.content,
          image: post.image,
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
        });

        if (result.success) {
          // Update post as published
          await db
            .update(posts)
            .set({
              status: 'published',
              publishedAt: new Date(),
              metadata: {
                platformPostId: result.platformPostId,
                publishedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));

          results.push({
            postId: post.id,
            success: true,
            platformPostId: result.platformPostId,
          });

          console.log(`Successfully published post ${post.id} to ${post.platform}`);
        } else {
          // Update post as failed
          await db
            .update(posts)
            .set({
              status: 'failed',
              metadata: {
                error: result.error,
                failedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));

          results.push({
            postId: post.id,
            success: false,
            error: result.error,
          });

          console.error(`Failed to publish post ${post.id} to ${post.platform}:`, result.error);
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);

        // Update post as failed
        await db
          .update(posts)
          .set({
            status: 'failed',
            metadata: {
              error: String(error),
              failedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(posts.id, post.id));

        results.push({
          postId: post.id,
          success: false,
          error: String(error),
        });
      }
    }
  } catch (error) {
    console.error('Error in publishScheduledPosts:', error);
  }

  return results;
}
