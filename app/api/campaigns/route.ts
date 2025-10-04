import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import { PlatformDataFetcher } from '@/lib/integrations/platform-data-fetcher';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platforms = searchParams.get('platforms')?.split(',').filter(Boolean);

    // Build query conditions
    const conditions = [eq(campaigns.userId, session.id)];

    // Filter by platforms if specified
    if (platforms && platforms.length > 0) {
      conditions.push(inArray(campaigns.platform, platforms));
    }

    // Get campaigns from database
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(...conditions));

    // Fetch real-time data from connected platforms
    let finalCampaigns: any[] = [...userCampaigns];
    let hasRealData = userCampaigns.length > 0;

    if (platforms && platforms.length > 0) {
      try {
        const platformData = await PlatformDataFetcher.fetchAllPlatformsData(
          session.id,
          platforms
        );

        // Merge platform data with existing campaigns
        if (platformData.length > 0) {
          finalCampaigns = [...finalCampaigns, ...platformData];
          hasRealData = true;
        }
      } catch (error) {
        console.error('Error fetching platform data:', error);
      }
    }

    // Only generate sample data if no real data exists
    if (!hasRealData && platforms && platforms.length > 0) {
      finalCampaigns = platforms.flatMap((platform, platformIndex) =>
        Array.from({ length: 3 }, (_, i) => ({
          id: `sample-${platform}-${i}`,
          userId: session.id,
          integrationId: null,
          platform,
          platformCampaignId: `${platform}-campaign-${i + 1}`,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Campaign ${i + 1}`,
          status: i === 0 ? 'active' : i === 1 ? 'paused' : 'delivered',
          spend: (Math.random() * 500 + 100).toFixed(2),
          clicks: Math.floor(Math.random() * 1000) + 200,
          impressions: Math.floor(Math.random() * 10000) + 2000,
          conversions: Math.floor(Math.random() * 100) + 20,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    // Calculate aggregated metrics
    const metrics = {
      totalSpend: finalCampaigns.reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0),
      totalClicks: finalCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
      totalConversions: finalCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0),
      totalImpressions: finalCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
    };

    // Group by month for chart data (last 12 months)
    const monthlyData = hasRealData
      ? Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          const month = date.toLocaleString('default', { month: 'short' });

          // For real data, distribute metrics evenly across months as approximation
          // In a real implementation, you'd track historical data
          const monthFraction = 1 / 12;
          return {
            month,
            spend: Math.floor(metrics.totalSpend * monthFraction),
            clicks: Math.floor(metrics.totalClicks * monthFraction),
            conversions: Math.floor(metrics.totalConversions * monthFraction),
          };
        })
      : Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return {
            month: date.toLocaleString('default', { month: 'short' }),
            spend: Math.floor(Math.random() * 50000) + 20000,
            clicks: Math.floor(Math.random() * 60000) + 30000,
            conversions: Math.floor(Math.random() * 70000) + 20000,
          };
        });

    return NextResponse.json({
      campaigns: finalCampaigns,
      metrics,
      monthlyData,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to get campaigns' },
      { status: 500 }
    );
  }
}
