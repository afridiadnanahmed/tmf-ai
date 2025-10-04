# TMF-AI Integration Setup Guide

## Dynamic OAuth System

TMF-AI uses a **dynamic OAuth configuration system** where each user configures their own OAuth applications. This approach provides:
- **No shared API rate limits** - Each user has their own limits
- **Complete data privacy** - Data flows directly between users and platforms
- **Unlimited scalability** - No bottlenecks from shared credentials
- **Multi-tenant support** - Perfect for SaaS applications

## Quick Start

### Step 1: Configure Your OAuth App

1. Go to **Settings → Integrations** in TMF-AI
2. Click **"Add OAuth App"**
3. Select the platform you want to connect
4. Enter your OAuth credentials (see platform-specific guides below)
5. Save the configuration

### Step 2: Connect the Platform

1. Go to **Dashboard → Integrations**
2. Find your platform in the **"Available"** tab
3. Click **"Connect"**
4. Authorize the connection when redirected to the platform
5. You're connected! The platform will appear in the **"Connected"** tab

## Platform-Specific Setup Guides

### Meta Ads (Facebook & Instagram)

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "Create App" → Choose "Business" type
   - Enter app name and contact email

2. **Configure OAuth**
   - In your app dashboard, go to "Add Product" → Add "Facebook Login"
   - Go to Facebook Login → Settings
   - Add to "Valid OAuth Redirect URIs":
     - Development: `http://localhost:3000/api/integrations/callback`
     - Production: `https://yourdomain.com/api/integrations/callback`

3. **Get Credentials**
   - Go to Settings → Basic
   - Copy **App ID** (this is your Client ID)
   - Copy **App Secret** (this is your Client Secret)

4. **Add in TMF-AI**
   - Go to Settings → Integrations
   - Add OAuth App → Select "Meta Ads"
   - Enter App ID and App Secret
   - Save

### Google Ads

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable "Google Ads API"

2. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add to "Authorized redirect URIs":
     - Development: `http://localhost:3000/api/integrations/callback`
     - Production: `https://yourdomain.com/api/integrations/callback`

3. **Get Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**

4. **Add in TMF-AI**
   - Settings → Integrations → Add OAuth App
   - Select "Google Ads"
   - Enter credentials and save

### TikTok Ads

1. **Register TikTok App**
   - Go to [TikTok for Business Developers](https://business-api.tiktok.com/)
   - Create new app
   - Configure for "Ads Management API"

2. **Configure OAuth**
   - Add Redirect URI:
     - Development: `http://localhost:3000/api/integrations/callback`
     - Production: `https://yourdomain.com/api/integrations/callback`

3. **Get Credentials**
   - Copy **App ID** (Client ID)
   - Copy **App Secret** (Client Secret)

4. **Add in TMF-AI**
   - Configure in Settings → Integrations

### LinkedIn Ads

1. **Create LinkedIn App**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
   - Create new app
   - Request access to "Marketing Developer Platform"

2. **Configure OAuth 2.0**
   - In Auth tab, add redirect URL:
     - `http://localhost:3000/api/integrations/callback` (dev)
     - `https://yourdomain.com/api/integrations/callback` (prod)

3. **Get Credentials**
   - Copy **Client ID**
   - Copy **Client Secret**

4. **Add in TMF-AI**
   - Settings → Integrations → Configure

## API Key Platforms

Some platforms use API keys instead of OAuth. These can be connected directly:

### Klaviyo
1. Log into Klaviyo
2. Account → Settings → API Keys
3. Create Private API Key (starts with `pk_`)
4. In TMF-AI: Click Connect → Enter company name and API key

### SendGrid
1. Log into SendGrid
2. Settings → API Keys → Create API Key
3. Choose "Full Access" or customize permissions
4. Copy the key (shown only once!)
5. In TMF-AI: Click Connect → Enter API key

### Stripe
1. Log into Stripe Dashboard
2. Developers → API Keys
3. Copy Secret Key (starts with `sk_`)
4. In TMF-AI: Click Connect → Enter key and select environment (test/live)

### Shopify
1. Log into Shopify Admin
2. Settings → Apps → Develop apps
3. Create private app
4. Generate Access Token
5. In TMF-AI: Enter store name and access token

## Important URLs

### Redirect URI Format
Always use this exact format for OAuth redirect URIs:
- **Development**: `http://localhost:3000/api/integrations/callback`
- **Production**: `https://yourdomain.com/api/integrations/callback`

⚠️ **Note**: Must match EXACTLY - no trailing slashes, correct protocol (http/https)

## Security Best Practices

1. **Keep Credentials Secure**
   - Never share your Client Secret
   - Rotate credentials periodically
   - Use different apps for dev/staging/production

2. **Limit Scopes**
   - Only grant necessary permissions
   - Review scope requirements regularly

3. **Monitor Usage**
   - Check API usage in platform dashboards
   - Set up alerts for unusual activity

## Troubleshooting

### "OAuth App Required" Error
**Solution**: Configure your OAuth app first in Settings → Integrations

### "Invalid Redirect URI" Error
**Solution**: Ensure redirect URI matches exactly:
- Check for trailing slashes (remove them)
- Verify http vs https
- Confirm domain name is correct

### "Invalid Credentials" Error
**Solution**: 
- Double-check Client ID and Secret
- Remove any extra spaces
- Ensure app is approved/active on platform

### "Token Expired" Error
**Solution**: Click "Reconnect" to refresh authorization

### Platform Not Appearing
**Solution**: Refresh the page - all 38 platforms should be visible

## Need Help?

1. Check the platform's developer documentation
2. Verify your OAuth app is active/approved
3. Ensure redirect URIs match exactly
4. Try disconnecting and reconnecting

## Supported Platforms (38 Total)

### Advertising (12)
Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, X Ads, Snapchat Ads, Pinterest Ads, Reddit Ads, Amazon Ads, YouTube Ads, Spotify Ads, Microsoft Ads

### Analytics (5)
Google Analytics, Mixpanel, Amplitude, Segment, Hotjar

### CRM (4)
HubSpot, Salesforce, Pipedrive, Zoho CRM

### Email Marketing (4)
Mailchimp, SendGrid, Klaviyo, Brevo

### Social Media (6)
Facebook, Instagram, X (Twitter), LinkedIn, TikTok, YouTube

### E-commerce (2)
Shopify, WooCommerce

### Payment (2)
Stripe, PayPal

### Communication (3)
Twilio, Slack, Discord