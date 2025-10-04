# LinkedIn OAuth Setup Guide

This guide will help you set up LinkedIn OAuth for your TMA-AI application.

## Prerequisites
- A LinkedIn account
- Access to LinkedIn Developer Portal

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click on "Create app"
3. Fill in the required information:
   - App name: "TMA-AI" (or your preferred name)
   - LinkedIn Page: Select or create a company page
   - Privacy policy URL: Your privacy policy URL
   - App logo: Upload your app logo
4. Click "Create app"

## Step 2: Configure OAuth Settings

1. In your LinkedIn app dashboard, go to the "Auth" tab
2. Add the following Authorized redirect URLs:
   - For development: `http://localhost:3000/api/integrations/callback`
   - For production: `https://yourdomain.com/api/integrations/callback`
3. Save the changes

## Step 3: Get Your Credentials

1. In the "Auth" tab, you'll find:
   - Client ID
   - Client Secret (click "Show" to reveal it)
2. Copy these values

## Step 4: Configure Your Application

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Update the LinkedIn OAuth credentials in your `.env` file:
   ```
   LINKEDIN_CLIENT_ID=your_actual_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_actual_linkedin_client_secret
   ```

3. Make sure you also have these configured:
   ```
   OAUTH_STATE_SECRET=generate_a_random_secret_string_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 5: Request API Access (Important!)

LinkedIn requires you to request access to certain APIs:

1. In your LinkedIn app dashboard, go to "Products"
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (Basic profile access)
   - **Share on LinkedIn** (To post content)
   - **Marketing Developer Platform** (For company page management)

Note: Some products require LinkedIn to review and approve your app. This can take a few days.

## Step 6: Test the Integration

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to the Integrations page in your dashboard
3. Click on LinkedIn
4. You should be redirected to LinkedIn's authorization page
5. Authorize the app
6. You'll be redirected back to your app with the connection established

## Troubleshooting

### "Invalid redirect_uri" error
- Make sure the redirect URI in your LinkedIn app matches exactly with what's configured in your application
- Check that `NEXT_PUBLIC_APP_URL` in your `.env` file is correct

### "Invalid client_id" error
- Double-check that your `LINKEDIN_CLIENT_ID` in `.env` matches the Client ID from LinkedIn

### "Unauthorized" error
- Ensure your LinkedIn app is active (not in development mode if testing in production)
- Check that you've requested and been granted access to the necessary LinkedIn products

## OAuth Flow Explanation

When a user clicks "Connect" on LinkedIn:

1. **Frontend** (`integrations-screen.tsx`): Calls `/api/integrations/connect` with platform ID
2. **Connect API** (`/api/integrations/connect/route.ts`): 
   - Generates a secure state parameter
   - Creates LinkedIn authorization URL
   - Returns URL to frontend
3. **Browser**: Redirects to LinkedIn authorization page
4. **User**: Authorizes the app on LinkedIn
5. **LinkedIn**: Redirects to `/api/integrations/callback` with authorization code
6. **Callback API** (`/api/integrations/callback/route.ts`):
   - Validates state parameter
   - Exchanges authorization code for access tokens
   - Stores tokens in database
   - Redirects to integrations page with success message

## Security Notes

- Never commit your actual credentials to version control
- Always use `.env` files for sensitive information
- The `OAUTH_STATE_SECRET` is used to sign state parameters to prevent CSRF attacks
- Access tokens are encrypted before storing in the database
- Refresh tokens are used to renew access when tokens expire

## Next Steps

After successfully connecting LinkedIn:
- The access token will be stored in your database
- You can use this token to make API calls to LinkedIn
- The integration will appear as "Connected" in your dashboard
- You can then fetch data or post content to LinkedIn through the API