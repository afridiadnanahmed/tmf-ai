// Platform-specific posting clients

interface PostData {
  content: string;
  image?: string | null;
  accessToken: string;
  refreshToken?: string | null;
}

interface PostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

// Twitter/X Posting
export async function postToTwitter(data: PostData): Promise<PostResult> {
  try {
    let mediaIds: string[] = [];

    // If there's an image, upload it first
    if (data.image) {
      try {
        let imageBuffer: ArrayBuffer;

        // Check if it's a URL or local path
        if (data.image.startsWith('http://') || data.image.startsWith('https://')) {
          // Fetch from URL
          const imageResponse = await fetch(data.image);
          if (!imageResponse.ok) {
            console.error('Failed to fetch image from URL:', data.image);
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }
          imageBuffer = await imageResponse.arrayBuffer();
        } else {
          // Read from local file system
          const fs = await import('fs/promises');
          const path = await import('path');

          // Convert relative path to absolute path
          let filePath = data.image;
          if (filePath.startsWith('/uploads/')) {
            // Remove leading slash and prepend public directory
            filePath = path.join(process.cwd(), 'public', filePath);
          } else if (!path.isAbsolute(filePath)) {
            filePath = path.join(process.cwd(), 'public', filePath);
          }

          console.log('Reading image from file:', filePath);
          const fileBuffer = await fs.readFile(filePath);
          imageBuffer = fileBuffer.buffer;
        }

        // Get file extension to determine media type
        const fileExtension = data.image.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        const mediaType = mimeTypes[fileExtension] || 'image/jpeg';
        const totalBytes = imageBuffer.byteLength;

        // Step 1: Initialize upload
        const initResponse = await fetch(
          'https://api.x.com/2/media/upload/initialize',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              media_type: mediaType,
              total_bytes: totalBytes,
              media_category: 'tweet_image',
            }),
          }
        );

        if (!initResponse.ok) {
          const initError = await initResponse.text();
          console.error('Twitter media init failed:', initResponse.status, initError);
          throw new Error(`Media init failed: ${initResponse.status}`);
        }

        const initText = await initResponse.text();
        console.log('Init response:', initText);

        let initResult;
        try {
          initResult = JSON.parse(initText);
        } catch (e) {
          console.error('Failed to parse init response');
          throw new Error('Invalid init response');
        }

        const mediaId = initResult.data?.id || initResult.media_id_string || initResult.media_id;
        if (!mediaId) {
          console.error('No media ID in response:', initResult);
          throw new Error('No media ID returned from init');
        }
        console.log('Media init successful, ID:', mediaId);

        // Step 2: Append media data (in chunks if needed)
        const chunkSize = 2 * 1024 * 1024; // 2MB chunks
        const buffer = Buffer.from(imageBuffer);
        let segmentIndex = 0;

        for (let i = 0; i < buffer.length; i += chunkSize) {
          const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));

          const appendResponse = await fetch(
            `https://api.x.com/2/media/upload/${mediaId}/append`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                media: chunk.toString('base64'),
                segment_index: segmentIndex,
              }),
            }
          );

          if (!appendResponse.ok) {
            const appendError = await appendResponse.text();
            console.error('Twitter media append failed:', appendResponse.status, appendError);
            throw new Error(`Media append failed: ${appendResponse.status}`);
          }

          segmentIndex++;
        }

        console.log('Media append successful');

        // Step 3: Finalize upload
        const finalizeResponse = await fetch(
          `https://api.x.com/2/media/upload/${mediaId}/finalize`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.accessToken}`,
            },
          }
        );

        if (!finalizeResponse.ok) {
          const finalizeError = await finalizeResponse.text();
          console.error('Twitter media finalize failed:', finalizeResponse.status, finalizeError);
          throw new Error(`Media finalize failed: ${finalizeResponse.status}`);
        }

        console.log('Media upload finalized successfully');
        mediaIds.push(mediaId);
      } catch (imageError) {
        console.error('Error processing image:', imageError);
      }
    }

    // Create the tweet payload
    const tweetPayload: any = {
      text: data.content,
    };

    // Add media if uploaded successfully
    if (mediaIds.length > 0) {
      tweetPayload.media = {
        media_ids: mediaIds,
      };
    }

    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twitter post failed:', error);
      return { success: false, error: `Twitter API error: ${response.status}` };
    }

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Twitter response:', responseText);
      return { success: false, error: 'Invalid response from Twitter API' };
    }

    return {
      success: true,
      platformPostId: result.data?.id,
    };
  } catch (error) {
    console.error('Twitter post error:', error);
    return { success: false, error: String(error) };
  }
}

// Facebook Posting
export async function postToFacebook(data: PostData): Promise<PostResult> {
  try {
    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${data.accessToken}`
    );

    if (!pagesResponse.ok) {
      return { success: false, error: 'Failed to fetch Facebook pages' };
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return { success: false, error: 'No Facebook pages found' };
    }

    // Post to the first page (you can modify this logic)
    const page = pages[0];
    const pageAccessToken = page.access_token;

    const postData: any = {
      message: data.content,
      access_token: pageAccessToken,
    };

    if (data.image) {
      postData.url = data.image;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Facebook post failed:', error);
      return { success: false, error: `Facebook API error: ${response.status}` };
    }

    const result = await response.json();
    return {
      success: true,
      platformPostId: result.id,
    };
  } catch (error) {
    console.error('Facebook post error:', error);
    return { success: false, error: String(error) };
  }
}

// LinkedIn Posting
export async function postToLinkedIn(data: PostData): Promise<PostResult> {
  try {
    // Get user profile URN
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${data.accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      return { success: false, error: 'Failed to fetch LinkedIn profile' };
    }

    const profile = await profileResponse.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    const postPayload = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: data.content,
          },
          shareMediaCategory: data.image ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LinkedIn post failed:', error);
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }

    const result = await response.json();
    return {
      success: true,
      platformPostId: result.id,
    };
  } catch (error) {
    console.error('LinkedIn post error:', error);
    return { success: false, error: String(error) };
  }
}

// Instagram Posting (via Facebook Graph API)
export async function postToInstagram(data: PostData): Promise<PostResult> {
  try {
    if (!data.image) {
      return { success: false, error: 'Instagram requires an image' };
    }

    // Get Instagram business account
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${data.accessToken}`
    );

    if (!accountResponse.ok) {
      return { success: false, error: 'Failed to fetch Instagram account' };
    }

    const accountData = await accountResponse.json();
    const pages = accountData.data || [];

    if (pages.length === 0) {
      return { success: false, error: 'No Facebook pages found' };
    }

    // Get Instagram account ID
    const page = pages[0];
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igData = await igResponse.json();
    const igAccountId = igData.instagram_business_account?.id;

    if (!igAccountId) {
      return { success: false, error: 'No Instagram business account linked' };
    }

    // Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: data.image,
          caption: data.content,
          access_token: page.access_token,
        }),
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.text();
      return { success: false, error: `Failed to create Instagram media: ${error}` };
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    // Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: page.access_token,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      return { success: false, error: `Failed to publish Instagram media: ${error}` };
    }

    const publishData = await publishResponse.json();
    return {
      success: true,
      platformPostId: publishData.id,
    };
  } catch (error) {
    console.error('Instagram post error:', error);
    return { success: false, error: String(error) };
  }
}

// Main posting function that routes to appropriate platform
export async function postToPlatform(
  platform: string,
  data: PostData
): Promise<PostResult> {
  switch (platform) {
    case 'twitter':
    case 'twitterAds':
      return postToTwitter(data);

    case 'facebook':
    case 'metaAds':
      return postToFacebook(data);

    case 'linkedin':
    case 'linkedinAds':
      return postToLinkedIn(data);

    case 'instagram':
      return postToInstagram(data);

    default:
      return {
        success: false,
        error: `Platform ${platform} not supported for posting yet`,
      };
  }
}
