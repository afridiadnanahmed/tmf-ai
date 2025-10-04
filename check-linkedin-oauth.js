const { db } = require('./lib/db/index.ts');
const { oauthApps } = require('./lib/db/schema.ts');
const { eq } = require('drizzle-orm');

async function checkLinkedInOAuth() {
  try {
    const apps = await db
      .select()
      .from(oauthApps)
      .where(eq(oauthApps.platform, 'linkedinAds'));

    console.log('LinkedIn Ads OAuth Apps:');
    if (apps.length > 0) {
      apps.forEach(app => {
        console.log('ID:', app.id);
        console.log('Client ID:', app.clientId);
        console.log('Redirect URI:', app.redirectUri);
        console.log('Scopes:', app.scopes);
        console.log('Is Active:', app.isActive);
        console.log('---');
      });
    } else {
      console.log('No LinkedIn Ads OAuth apps found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkLinkedInOAuth();