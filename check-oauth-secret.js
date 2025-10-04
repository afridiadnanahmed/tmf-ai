const { db } = require('./lib/db/index.ts');
const { oauthApps } = require('./lib/db/schema.ts');
const { eq } = require('drizzle-orm');

async function checkOAuthSecret() {
  try {
    const apps = await db
      .select()
      .from(oauthApps)
      .where(eq(oauthApps.platform, 'googleAds'));

    if (apps.length > 0) {
      const app = apps[0];
      console.log('Google Ads OAuth App Found:');
      console.log('ID:', app.id);
      console.log('Client ID:', app.clientId);
      console.log('Has Client Secret:', !!app.clientSecret);
      if (app.clientSecret) {
        console.log('Client Secret Length:', app.clientSecret.length);
        console.log('Client Secret Format (first 20 chars):', app.clientSecret.substring(0, 20) + '...');
      } else {
        console.log('WARNING: No client secret found!');
      }
      console.log('Redirect URI:', app.redirectUri);
      console.log('Scopes:', app.scopes);
      console.log('Is Active:', app.isActive);
    } else {
      console.log('No Google Ads OAuth apps found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkOAuthSecret();