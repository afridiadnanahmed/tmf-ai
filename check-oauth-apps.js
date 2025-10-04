const { db } = require('./lib/db/index.ts');
const { oauthApps } = require('./lib/db/schema.ts');
const { eq } = require('drizzle-orm');

async function checkOAuthApps() {
  try {
    const apps = await db
      .select({
        id: oauthApps.id,
        platform: oauthApps.platform,
        clientId: oauthApps.clientId,
        redirectUri: oauthApps.redirectUri,
        scopes: oauthApps.scopes,
        isActive: oauthApps.isActive,
        createdAt: oauthApps.createdAt
      })
      .from(oauthApps)
      .where(eq(oauthApps.platform, 'googleAds'));

    console.log('Google Ads OAuth Apps:');
    console.log(JSON.stringify(apps, null, 2));

    if (apps.length > 0) {
      console.log('\nActive app details:');
      const activeApp = apps.find(app => app.isActive);
      if (activeApp) {
        console.log('Client ID:', activeApp.clientId);
        console.log('Redirect URI:', activeApp.redirectUri);
        console.log('Scopes:', activeApp.scopes);
      } else {
        console.log('No active Google Ads OAuth app found');
      }
    } else {
      console.log('No Google Ads OAuth apps found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkOAuthApps();