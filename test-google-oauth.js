const https = require('https');
const dns = require('dns').promises;

async function testGoogleOAuth() {
  console.log('Testing Google OAuth connectivity...\n');

  // Test DNS resolution
  try {
    const addresses = await dns.resolve4('oauth2.googleapis.com');
    console.log('DNS resolution successful:', addresses);
  } catch (error) {
    console.error('DNS resolution failed:', error);
  }

  // Test with native fetch
  console.log('\nTesting with native fetch...');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=authorization_code&code=test&client_id=test&client_secret=test&redirect_uri=http://localhost:3000',
    });
    const data = await response.text();
    console.log('Fetch successful! Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }

  // Test with https module
  console.log('\nTesting with https module...');
  return new Promise((resolve) => {
    const postData = 'grant_type=authorization_code&code=test&client_id=test&client_secret=test&redirect_uri=http://localhost:3000';

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('HTTPS request successful! Status:', res.statusCode);
        console.log('Response:', data);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('HTTPS request failed:', error.message);
      resolve();
    });

    req.on('timeout', () => {
      console.error('HTTPS request timeout!');
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testGoogleOAuth().then(() => {
  console.log('\nTest complete!');
  process.exit(0);
});