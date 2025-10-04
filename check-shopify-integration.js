const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkShopifyIntegration() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        platform,
        access_token IS NOT NULL as has_access_token,
        metadata,
        is_active,
        created_at
      FROM integrations
      WHERE platform = 'shopify'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\nShopify Integrations:');
    console.log(JSON.stringify(result.rows, null, 2));

    if (result.rows.length > 0) {
      const integration = result.rows[0];
      console.log('\nMost recent Shopify integration:');
      console.log('ID:', integration.id);
      console.log('User ID:', integration.user_id);
      console.log('Has Access Token:', integration.has_access_token);
      console.log('Metadata:', integration.metadata);
      console.log('Is Active:', integration.is_active);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkShopifyIntegration();
