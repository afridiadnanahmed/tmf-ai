import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function exchangeGoogleTokenWithCurl(
  tokenUrl: string,
  params: URLSearchParams
): Promise<any> {
  const postData = params.toString();

  // Build curl command
  const curlCommand = `curl -s -X POST "${tokenUrl}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "${postData}" \
    --max-time 30`;

  console.log('[exchangeGoogleTokenWithCurl] Executing curl command for Google OAuth...');

  try {
    const { stdout, stderr } = await execAsync(curlCommand);

    if (stderr) {
      console.error('[exchangeGoogleTokenWithCurl] Curl stderr:', stderr);
    }

    const response = JSON.parse(stdout);

    if (response.error) {
      console.error('[exchangeGoogleTokenWithCurl] OAuth error:', response.error, response.error_description);
      throw new Error(`OAuth error: ${response.error} - ${response.error_description}`);
    }

    console.log('[exchangeGoogleTokenWithCurl] Token exchange successful');
    return response;
  } catch (error: any) {
    console.error('[exchangeGoogleTokenWithCurl] Failed:', error.message);
    throw error;
  }
}