import crypto from 'crypto';
import { getOAuthConfig } from './oauth-config';

// PKCE helpers for OAuth 2.0 (required by Twitter/X)
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
  timestamp: number;
}

// Generate a secure state parameter for OAuth
export function generateOAuthState(userId: string, platform: string): string {
  const state: OAuthState = {
    userId,
    platform,
    timestamp: Date.now(),
  };
  
  // Use base64 encoding for simplicity (in production, use proper encryption)
  const stateString = JSON.stringify(state);
  const encoded = Buffer.from(stateString).toString('base64url');
  
  // Add a simple signature to prevent tampering
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

// Generate OAuth authorization URL
export function generateAuthorizationUrl(
  platform: string,
  redirectUri: string,
  state: string
): string | null {
  const config = getOAuthConfig(platform);
  if (!config || !config.authorizationUrl) {
    return null;
  }
  
  const clientId = config.clientId;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
  });
  
  // Add scope if available
  if (config.scope && config.scope.length > 0) {
    params.append('scope', config.scope.join(' '));
  }
  
  // Platform-specific parameters
  switch (platform) {
    case 'meta':
      params.append('display', 'popup');
      break;
    case 'googleAds':
    case 'googleAnalytics':
    case 'youtube':
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
      break;
    case 'linkedin':
      params.append('response_type', 'code');
      break;
    case 'twitter':
      // Twitter requires PKCE
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
      // Store code verifier in state for later use
      // In production, store this securely (e.g., in session)
      break;
    case 'pinterest':
      params.append('response_type', 'code');
      break;
    case 'tiktok':
      params.append('response_type', 'code');
      break;
    case 'snapchat':
      params.append('response_type', 'code');
      break;
    case 'spotify':
      params.append('show_dialog', 'true');
      break;
  }
  
  return `${config.authorizationUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  platform: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokens | null> {
  const config = getOAuthConfig(platform);
  if (!config || !config.tokenUrl || !config.clientSecret) {
    return null;
  }
  
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Token exchange failed for ${platform}:`, error);
      return null;
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  } catch (error) {
    console.error(`Token exchange error for ${platform}:`, error);
    return null;
  }
}

// Refresh access token
export async function refreshAccessToken(
  platform: string,
  refreshToken: string
): Promise<OAuthTokens | null> {
  const config = getOAuthConfig(platform);
  if (!config || !config.tokenUrl || !config.clientSecret) {
    return null;
  }
  
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  try {
    const response = await fetch(config.tokenUrl, {
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
      refreshToken: data.refresh_token || refreshToken, // Some platforms don't return new refresh token
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  } catch (error) {
    console.error(`Token refresh error for ${platform}:`, error);
    return null;
  }
}

// Revoke tokens
export async function revokeTokens(
  platform: string,
  token: string
): Promise<boolean> {
  const config = getOAuthConfig(platform);
  const clientId = config?.clientId || '';
  const clientSecret = config?.clientSecret || '';
  // Platform-specific revocation endpoints
  let revokeUrl: string | null = null;
  
  switch (platform) {
    case 'google':
    case 'googleAds':
    case 'googleAnalytics':
    case 'youtube':
      revokeUrl = 'https://oauth2.googleapis.com/revoke';
      break;
    case 'meta':
      // Meta uses DELETE request to remove permissions
      revokeUrl = `https://graph.facebook.com/v18.0/me/permissions`;
      break;
    case 'linkedin':
      // LinkedIn doesn't have a revoke endpoint, tokens expire naturally
      return true;
    default:
      return false;
  }
  
  if (!revokeUrl) {
    return false;
  }
  
  try {
    let response: Response;
    
    if (platform === 'meta') {
      // Meta-specific revocation
      response = await fetch(`${revokeUrl}?access_token=${token}`, {
        method: 'DELETE',
      });
    } else {
      // Standard OAuth2 revocation
      const params = new URLSearchParams({
        token,
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
    }
    
    return response.ok;
  } catch (error) {
    console.error(`Token revocation error for ${platform}:`, error);
    return false;
  }
}