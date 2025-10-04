import https from 'https';
import { URL } from 'url';

export function exchangeGoogleTokenWithHttps(
  tokenUrl: string,
  params: URLSearchParams
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(tokenUrl);
    const postData = params.toString();

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 30000, // 30 seconds timeout
    };

    console.log('[exchangeGoogleTokenWithHttps] Making request to:', url.href);
    console.log('[exchangeGoogleTokenWithHttps] Request options:', {
      hostname: options.hostname,
      path: options.path,
      method: options.method,
    });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('[exchangeGoogleTokenWithHttps] Response status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.error('[exchangeGoogleTokenWithHttps] Failed to parse response:', data);
            reject(new Error('Invalid JSON response from Google'));
          }
        } else {
          console.error('[exchangeGoogleTokenWithHttps] Error response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[exchangeGoogleTokenWithHttps] Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('[exchangeGoogleTokenWithHttps] Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Write data to request body
    req.write(postData);
    req.end();
  });
}