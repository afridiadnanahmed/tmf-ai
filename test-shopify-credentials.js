const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testShopifyCredentials() {
  try {
    const result = await pool.query(`
      SELECT
        platform,
        access_token,
        metadata
      FROM integrations
      WHERE platform = 'shopify' AND is_active = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('No active Shopify integration found');
      await pool.end();
      return;
    }

    const integration = result.rows[0];
    console.log('\n=== Shopify Integration ===');
    console.log('Platform:', integration.platform);
    console.log('Metadata:', JSON.stringify(integration.metadata, null, 2));
    console.log('\nAccess Token (raw):', integration.access_token?.substring(0, 50) + '...');

    try {
      const credentials = JSON.parse(integration.access_token);
      console.log('\n=== Parsed Credentials ===');
      console.log('Store Name:', credentials.storeName);
      console.log('Access Token exists:', !!credentials.accessToken);
      console.log('Access Token prefix:', credentials.accessToken?.substring(0, 10));
    } catch (error) {
      console.error('\nFailed to parse access_token as JSON:', error.message);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testShopifyCredentials();
