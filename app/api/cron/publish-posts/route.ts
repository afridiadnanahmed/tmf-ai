// Cron job endpoint for publishing scheduled posts

import { NextRequest, NextResponse } from 'next/server';
import { publishScheduledPosts } from '@/lib/posting/post-publisher';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled post publishing...');
    const results = await publishScheduledPosts();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Publishing complete: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      totalProcessed: results.length,
      successful: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
