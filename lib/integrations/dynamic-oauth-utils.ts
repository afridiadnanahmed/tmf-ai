import crypto from 'crypto';
import { db } from '@/lib/db';
import { oauthApps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { exchangeGoogleTokenWithHttps } from './google-oauth-helper';
import { exchangeGoogleTokenWithCurl } from './google-oauth-curl';

// Encryption/decryption helpers
const algorithm = 'aes-256-gcm';
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  return crypto.createHash('sha256').update(key).digest();
};

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// PKCE helpers for OAuth 2.0
function generateCodeVerifier(): string {
  const buffer = crypto.randomBytes(32);
  return buffer.toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export interface OAuthState {
  userId: string;
  platform: string;
  oauthAppId: string;
  timestamp: number;
  codeVerifier?: string; // For PKCE
}

// Get user's OAuth app configuration
export async function getUserOAuthConfig(userId: string, platform: string) {
  const userOAuthApp = await db
    .select()
    .from(oauthApps)
    .where(
      and(
        eq(oauthApps.userId, userId),
        eq(oauthApps.platform, platform),
        eq(oauthApps.isActive, true)
      )
    )
    .limit(1);
  
  if (userOAuthApp.length === 0) {
    return null;
  }
  
  const app = userOAuthApp[0];
  
  // Decrypt client secret if present
  let clientSecret = null;
  if (app.clientSecret) {
    clientSecret = decryptSecret(app.clientSecret);
  }
  
  return {
    id: app.id,
    clientId: app.clientId,
    clientSecret,
    redirectUri: app.redirectUri,
    scopes: app.scopes as string[] | null,
  };
}

// Generate a secure state parameter for OAuth
export function generateOAuthState(
  userId: string, 
  platform: string, 
  oauthAppId: string,
  codeVerifier?: string
): string {
  const state: OAuthState = {
    userId,
    platform,
    oauthAppId,
    timestamp: Date.now(),
    codeVerifier,
  };
  
  // Use base64 encoding with HMAC signature
  const stateString = JSON.stringify(state);
  const encoded = Buffer.from(stateString).toString('base64url');
  
  // Add a signature to prevent tampering
  const secret = process.env.OAUTH_STATE_SECRET || 'default-secret-key';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(encoded);
  const signature = hmac.digest('hex').substring(0, 16);
  
  return `${encoded}.${signature}`;
}

// Decrypt and validate OAuth state
export function decryptOAuthState(encryptedState: string): OAuthState | null {
  try {
    const [encoded, signature] = encryptedState.split('.');
    if (!encoded || !signature) {
      return null;
    }
    
    // Verify signature
    const secret = process.env.OAUTH_STATE_SECRET || 'default-secret-key';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(encoded);
    const expectedSignature = hmac.digest('hex').substring(0, 16);
    
    if (signature !== expectedSignature) {
      console.error('Invalid OAuth state signature');
      return null;
    }
    
    // Decode state
    const stateString = Buffer.from(encoded, 'base64url').toString('utf8');
    const state: OAuthState = JSON.parse(stateString);
    
    // Check if state is not older than 10 minutes
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    if (state.timestamp < tenMinutesAgo) {
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to decrypt OAuth state:', error);
    return null;
  }
}

// Get platform OAuth URLs from configuration
export function getPlatformOAuthUrls(platform: string) {
  // These are the standard OAuth URLs for each platform
  // They don't change per user, only the credentials do
  const urls: Record<string, { authorizationUrl: string; tokenUrl: string; scopes?: string[] }> = {
    facebook: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['email', 'public_profile', 'pages_show_list', 'pages_read_engagement'],
    },
    meta: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['email', 'public_profile', 'pages_show_list', 'pages_read_engagement'],
    },
    metaAds: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['ads_read', 'ads_management', 'business_management'],
    },
    instagram: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_read_engagement'],
    },
    google: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    },
    googleAds: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/adwords'],
    },
    googleAnalytics: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    },
    youtube: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
    },
    linkedin: {
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    },
    linkedinAds: {
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_liteprofile', 'r_emailaddress', 'rw_organization_admin', 'r_ads', 'rw_ads'],
    },
    twitter: {
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
    twitterAds: {
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
    tiktok: {
      authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
      scopes: ['user.info.basic', 'video.list'],
    },
    tiktokAds: {
      authorizationUrl: 'https://business-api.tiktok.com/portal/auth',
      tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token',
      scopes: [],
    },
    pinterest: {
      authorizationUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scopes: ['boards:read', 'pins:read', 'user_accounts:read'],
    },
    pinterestAds: {
      authorizationUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scopes: ['ads:read', 'catalogs:read', 'boards:read', 'pins:read'],
    },
    snapchat: {
      authorizationUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
      tokenUrl: 'https://accounts.snapchat.com/login/oauth2/access_token',
      scopes: ['snapchat-marketing-api'],
    },
    snapchatAds: {
      authorizationUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
      tokenUrl: 'https://accounts.snapchat.com/login/oauth2/access_token',
      scopes: ['snapchat-marketing-api'],
    },
    reddit: {
      authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      scopes: ['identity', 'read'],
    },
    redditAds: {
      authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      scopes: ['identity', 'read', 'ads:read'],
    },
    spotify: {
      authorizationUrl: 'https://accounts.spotify.com/authorize',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      scopes: ['user-read-private', 'user-read-email'],
    },
    amazonAds: {
      authorizationUrl: 'https://www.amazon.com/ap/oa',
      tokenUrl: 'https://api.amazon.com/auth/o2/token',
      scopes: ['advertising::campaign_management'],
    },
    // Add more platforms as needed
  };
  
  return urls[platform] || null;
}

// Generate OAuth authorization URL with user's credentials
export async function generateAuthorizationUrl(
  userId: string,
  platform: string,
  redirectUri: string
): Promise<{ authUrl: string; state: string } | null> {
  // Get user's OAuth app configuration
  const userConfig = await getUserOAuthConfig(userId, platform);
  if (!userConfig) {
    return null;
  }
  
  // Get platform OAuth URLs
  const platformUrls = getPlatformOAuthUrls(platform);
  if (!platformUrls) {
    return null;
  }
  
  // Use user's redirect URI if configured, otherwise use the provided one
  const finalRedirectUri = userConfig.redirectUri || redirectUri;
  
  // Generate PKCE parameters for platforms that require it
  let codeVerifier: string | undefined;
  let codeChallenge: string | undefined;
  
  if (platform === 'twitter' || platform === 'twitterAds') {
    codeVerifier = generateCodeVerifier();
    codeChallenge = generateCodeChallenge(codeVerifier);
  }
  
  // Generate state with OAuth app ID and code verifier
  const state = generateOAuthState(userId, platform, userConfig.id, codeVerifier);
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: userConfig.clientId,
    redirect_uri: finalRedirectUri,
    state,
    response_type: 'code',
  });
  
  // Add scopes
  const scopes = userConfig.scopes || platformUrls.scopes || [];

  // Platform-specific parameters
  switch (platform) {
    case 'facebook':
    case 'meta':
    case 'metaAds':
    case 'instagram':
      if (scopes.length > 0) {
        params.append('scope', scopes.join(' '));
      }
      params.append('display', 'popup');
      break;
    case 'google':
    case 'googleAds':
    case 'googleAnalytics':
    case 'youtube':
      // Google services always require scope parameter, even if empty
      params.append('scope', scopes.length > 0 ? scopes.join(' ') : 'openid email profile');
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
      // Google Ads specific - ensure include_granted_scopes
      if (platform === 'googleAds') {
        params.append('include_granted_scopes', 'true');
        // Ensure Google Ads API scope is included
        if (!scopes.some(s => s.includes('adwords'))) {
          const currentScope = params.get('scope') || '';
          params.set('scope', `${currentScope} https://www.googleapis.com/auth/adwords`.trim());
        }
      }
      break;
    case 'twitter':
    case 'twitterAds':
      if (scopes.length > 0) {
        params.append('scope', scopes.join(' '));
      }
      if (codeChallenge) {
        params.append('code_challenge', codeChallenge);
        params.append('code_challenge_method', 'S256');
      }
      break;
    case 'linkedin':
    case 'linkedinAds':
      // LinkedIn always requires scope parameter
      if (platform === 'linkedinAds') {
        // LinkedIn Ads with Advertising API access
        // Using only advertising-specific scopes (no email/profile scopes needed)
        const defaultScopes = 'r_ads r_ads_reporting rw_ads r_organization_social w_organization_social';
        params.append('scope', scopes.length > 0 ? scopes.join(' ') : defaultScopes);
      } else {
        // Basic LinkedIn (try openid profile email if Sign In with LinkedIn using OpenID Connect is available)
        params.append('scope', scopes.length > 0 ? scopes.join(' ') : 'openid profile email');
      }
      break;
    case 'spotify':
      if (scopes.length > 0) {
        params.append('scope', scopes.join(' '));
      }
      params.append('show_dialog', 'true');
      break;
    case 'tiktokAds':
      if (scopes.length > 0) {
        params.append('scope', scopes.join(' '));
      }
      params.append('app_id', userConfig.clientId);
      break;
    default:
      // For all other platforms, add scope if available
      if (scopes.length > 0) {
        params.append('scope', scopes.join(' '));
      }
      break;
  }
  
  return {
    authUrl: `${platformUrls.authorizationUrl}?${params.toString()}`,
    state,
  };
}

// Exchange authorization code for tokens with user's credentials
export async function exchangeCodeForTokens(
  oauthAppId: string,
  platform: string,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<OAuthTokens | null> {
  console.log('[exchangeCodeForTokens] Starting token exchange for platform:', platform);

  try {
    // Get OAuth app configuration
    const oauthApp = await db
      .select()
      .from(oauthApps)
      .where(eq(oauthApps.id, oauthAppId))
      .limit(1);

    if (oauthApp.length === 0) {
      console.error('[exchangeCodeForTokens] OAuth app not found:', oauthAppId);
      console.error('[exchangeCodeForTokens] This usually means the OAuth app was deleted from the database.');
      console.error('[exchangeCodeForTokens] Please recreate the OAuth app in Settings > Integrations');
      return null;
    }

    const app = oauthApp[0];
    console.log('[exchangeCodeForTokens] OAuth app found:', {
      platform: app.platform,
      hasClientSecret: !!app.clientSecret,
      redirectUri: app.redirectUri
    });

    // Decrypt client secret
    let clientSecret = null;
    if (app.clientSecret) {
      clientSecret = decryptSecret(app.clientSecret);
    }

    // Get platform OAuth URLs
    const platformUrls = getPlatformOAuthUrls(platform);
    if (!platformUrls || !platformUrls.tokenUrl) {
      console.error('[exchangeCodeForTokens] Platform URLs not found for:', platform);
      return null;
    }

    const finalRedirectUri = app.redirectUri || redirectUri;

    // Build token request
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: app.clientId,
      redirect_uri: finalRedirectUri,
    });

    // Add client secret if available (not all platforms require it)
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    // Add code verifier for PKCE (Twitter)
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    console.log('[exchangeCodeForTokens] Token request params:', {
      tokenUrl: platformUrls.tokenUrl,
      clientId: app.clientId,
      hasClientSecret: !!clientSecret,
      redirectUri: finalRedirectUri,
      hasCodeVerifier: !!codeVerifier
    });

    // Log the actual request body for debugging
    console.log('[exchangeCodeForTokens] Request body params:');
    for (const [key, value] of params.entries()) {
      if (key === 'client_secret') {
        console.log(`  ${key}: [REDACTED - ${value.length} chars]`);
      } else if (key === 'code') {
        console.log(`  ${key}: ${value.substring(0, 20)}... [truncated]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // For Google platforms, use the alternative HTTPS method due to timeout issues
    const isGooglePlatform = platform.startsWith('google') || platform === 'youtube';
    let data;

    if (isGooglePlatform) {
      console.log('[exchangeCodeForTokens] Using curl method for Google platform (WSL2 workaround)');
      try {
        data = await exchangeGoogleTokenWithCurl(platformUrls.tokenUrl, params);
        console.log('[exchangeCodeForTokens] Google token exchange successful via curl');
      } catch (error: any) {
        console.error('[exchangeCodeForTokens] Curl request failed:', error.message);

        // Try HTTPS module as second attempt
        console.log('[exchangeCodeForTokens] Attempting with HTTPS module...');
        try {
          data = await exchangeGoogleTokenWithHttps(platformUrls.tokenUrl, params);
          console.log('[exchangeCodeForTokens] Google token exchange successful via HTTPS');
        } catch (httpsError: any) {
          console.error('[exchangeCodeForTokens] HTTPS also failed:', httpsError.message);

          // Last resort - try regular fetch
          console.log('[exchangeCodeForTokens] Final attempt with fetch...');
          try {
            const response = await fetch(platformUrls.tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[exchangeCodeForTokens] Fetch failed - HTTP ${response.status}:`, errorText);
              return null;
            }

            data = await response.json();
          } catch (fetchError) {
            console.error('[exchangeCodeForTokens] All methods failed:', fetchError);
            return null;
          }
        }
      }
    } else {
      // For non-Google platforms, use regular fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch(platformUrls.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[exchangeCodeForTokens] Fetch error:', fetchError.message);

        // Retry on timeout
        if (fetchError.name === 'AbortError' ||
            fetchError.code === 'ETIMEDOUT' ||
            (fetchError.cause && fetchError.cause.code === 'ETIMEDOUT')) {
          console.log('[exchangeCodeForTokens] Retrying due to timeout...');
          try {
            response = await fetch(platformUrls.tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });
          } catch (retryError) {
            console.error('[exchangeCodeForTokens] Retry failed:', retryError);
            throw retryError;
          }
        } else {
          throw fetchError;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response || !response.ok) {
        if (!response) {
          console.error(`[exchangeCodeForTokens] No response received for ${platform}`);
          return null;
        }
        const errorText = await response.text();
        console.error(`[exchangeCodeForTokens] Token exchange failed for ${platform}:`, errorText);
        console.error('[exchangeCodeForTokens] Response status:', response.status);
        return null;
      }

      data = await response.json();
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  } catch (error) {
    console.error(`[exchangeCodeForTokens] Error for ${platform}:`, error);
    if (error instanceof Error) {
      console.error('[exchangeCodeForTokens] Error message:', error.message);
      console.error('[exchangeCodeForTokens] Error stack:', error.stack);
    }
    return null;
  }
}

// Refresh access token with user's credentials
export async function refreshAccessToken(
  oauthAppId: string,
  platform: string,
  refreshToken: string
): Promise<OAuthTokens | null> {
  // Get OAuth app configuration
  const oauthApp = await db
    .select()
    .from(oauthApps)
    .where(eq(oauthApps.id, oauthAppId))
    .limit(1);
  
  if (oauthApp.length === 0) {
    return null;
  }
  
  const app = oauthApp[0];
  
  // Decrypt client secret
  let clientSecret = null;
  if (app.clientSecret) {
    clientSecret = decryptSecret(app.clientSecret);
  }
  
  // Get platform OAuth URLs
  const platformUrls = getPlatformOAuthUrls(platform);
  if (!platformUrls || !platformUrls.tokenUrl) {
    return null;
  }
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: app.clientId,
  });
  
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }
  
  try {
    const response = await fetch(platformUrls.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Token refresh failed for ${platform}:`, error);
      return null;
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  } catch (error) {
    console.error(`Token refresh error for ${platform}:`, error);
    return null;
  }
}