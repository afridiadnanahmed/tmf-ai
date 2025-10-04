# OAuth Integration Setup Guide

This guide provides step-by-step instructions for setting up OAuth authentication for all supported platforms in TMA-AI.

## How It Works

Similar to [DashThis](https://dashthis.com/), TMA-AI uses OAuth 2.0 to securely connect to your marketing platforms. Users simply:
1. Click on a platform
2. Authorize access in the platform's login page
3. Get automatically connected - no API keys needed!

## Quick Start

1. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

2. **Add OAuth credentials** for each platform you want to support

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Navigate to Integrations** at `/dashboard/integrations`

5. **Click any platform** to connect via OAuth

## Supported Platforms

All platforms use OAuth 2.0 authentication:

| Platform | Purpose | OAuth Provider |
|----------|---------|----------------|
| Meta (Facebook & Instagram) | Social media management | Facebook Login |
| Google Ads | Ad campaign management | Google OAuth 2.0 |
| Google Analytics | Website analytics | Google OAuth 2.0 |
| YouTube | Video analytics & management | Google OAuth 2.0 |
| LinkedIn | Professional networking | LinkedIn OAuth 2.0 |
| Twitter/X | Social media engagement | Twitter OAuth 2.0 |
| TikTok | Video content management | TikTok Login Kit |
| Pinterest | Visual content sharing | Pinterest OAuth |
| Mailchimp | Email marketing | Mailchimp OAuth |
| HubSpot | CRM & marketing automation | HubSpot OAuth |
| Snapchat | Snap Ads management | Snapchat OAuth |
| Spotify | Audio ad campaigns | Spotify OAuth |

## Platform Setup Instructions

### Meta (Facebook & Instagram)

1. **Create App**: [Meta for Developers](https://developers.facebook.com/)
2. **Add OAuth Redirect**: `http://localhost:3000/api/integrations/callback`
3. **Request Permissions**: pages_show_list, instagram_basic, ads_management
4. **Get Credentials**: App ID → `META_CLIENT_ID`, App Secret → `META_CLIENT_SECRET`

### Google Services (Ads, Analytics, YouTube)

1. **Create Project**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**: Google Ads API, Analytics API, YouTube Data API
3. **Configure OAuth**: Add redirect URI
4. **Get Credentials**: Use same credentials for all Google services

### LinkedIn

1. **Create App**: [LinkedIn Developers](https://www.linkedin.com/developers/)
2. **Add Redirect URL**: `http://localhost:3000/api/integrations/callback`
3. **Request Products**: Sign In with LinkedIn, Share on LinkedIn
4. **Get Credentials**: Client ID & Secret

### Twitter/X

1. **Create App**: [Twitter Developer Portal](https://developer.twitter.com/)
2. **Enable OAuth 2.0**: Add callback URL
3. **Set Scopes**: tweet.read, tweet.write, users.read
4. **Get Credentials**: Client ID & Secret (OAuth 2.0)

### Other Platforms

See detailed instructions for each platform in the `.env.example` file comments.

## Environment Variables

All OAuth credentials are stored in environment variables:

```env
# Meta (Facebook & Instagram)
META_CLIENT_ID=your_app_id
META_CLIENT_SECRET=your_app_secret

# Google Services
GOOGLEADS_CLIENT_ID=your_client_id
GOOGLEADS_CLIENT_SECRET=your_client_secret
GOOGLEANALYTICS_CLIENT_ID=your_client_id
GOOGLEANALYTICS_CLIENT_SECRET=your_client_secret
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# ... etc for all platforms
```

## OAuth Flow

1. **User clicks platform** → Frontend calls `/api/integrations/connect`
2. **Generate auth URL** → Server creates secure authorization URL
3. **Redirect to platform** → User authorizes on platform's site
4. **Platform callback** → Platform redirects to `/api/integrations/callback`
5. **Exchange tokens** → Server exchanges code for access tokens
6. **Store securely** → Tokens saved encrypted in database
7. **Connection complete** → User sees "Connected" status

## Security Features

- **State parameter** with HMAC signature prevents CSRF attacks
- **Tokens encrypted** before database storage
- **Automatic token refresh** for expired tokens
- **Secure session management** for user authentication
- **Platform-specific security** (PKCE for Twitter, etc.)

## Testing Your Setup

1. **Check configuration**:
   ```bash
   # Platforms will only appear if credentials are configured
   npm run dev
   ```

2. **Test a connection**:
   - Go to `/dashboard/integrations`
   - Click on a configured platform
   - Complete OAuth flow
   - Verify "Connected" status

3. **Check logs** for any errors:
   - Browser console for frontend issues
   - Terminal for backend OAuth errors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Platform not visible | Add CLIENT_ID and CLIENT_SECRET to .env |
| Invalid redirect_uri | Ensure exact match with platform settings |
| Scope errors | Request required permissions in platform dashboard |
| Token expired | Automatic refresh or user re-authorizes |

## Production Deployment

1. **Update redirect URLs** in each platform to production domain
2. **Set production environment variables**
3. **Use HTTPS** for all OAuth redirects
4. **Implement rate limiting** for OAuth endpoints
5. **Monitor token usage** and implement refresh logic

## Support

- Platform-specific docs linked in `.env.example`
- Check console warnings for missing configurations
- OAuth errors logged with detailed messages

## Next Steps

Once connected, you can:
- Fetch data from connected platforms
- Post content across platforms
- Sync analytics and metrics
- Manage campaigns centrally
- View unified inbox for messages