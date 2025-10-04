import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ShopifyIntegration } from './handlers/shopify';

export interface PlatformCampaignData {
  id: string;
  name: string;
  platform: string;
  status: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  revenue?: number;
  metadata?: any;
}

export class PlatformDataFetcher {
  static async fetchPlatformData(
    userId: string,
    platformId: string
  ): Promise<PlatformCampaignData[]> {
    try {
      console.log(`[PlatformDataFetcher] Fetching data for platform: ${platformId}, userId: ${userId}`);

      // Get integration credentials
      const integration = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.platform, platformId),
            eq(integrations.isActive, true)
          )
        )
        .limit(1);

      if (!integration || integration.length === 0) {
        console.log(`[PlatformDataFetcher] No active integration found for platform: ${platformId}`);
        return [];
      }

      const integrationData = integration[0];
      console.log(`[PlatformDataFetcher] Found integration for ${platformId}, has accessToken: ${!!integrationData.accessToken}`);

      // Route to appropriate platform handler
      switch (platformId) {
        case 'shopify':
          return await this.fetchShopifyData(integrationData);

        case 'googleAds':
          return await this.fetchGoogleAdsData(integrationData);

        case 'facebook':
        case 'metaAds':
          return await this.fetchMetaAdsData(integrationData);

        case 'linkedinAds':
          return await this.fetchLinkedInAdsData(integrationData);

        default:
          console.log(`No handler for platform: ${platformId}`);
          return [];
      }
    } catch (error) {
      console.error(`Error fetching data for platform ${platformId}:`, error);
      return [];
    }
  }

  private static async fetchShopifyData(integration: any): Promise<PlatformCampaignData[]> {
    try {
      const metadata = integration.metadata as any;
      console.log(`[Shopify] Integration metadata:`, metadata);

      // Parse credentials from accessToken field (stored as JSON string)
      let credentials: any;
      try {
        credentials = JSON.parse(integration.accessToken);
      } catch (error) {
        console.error('[Shopify] Failed to parse credentials:', error);
        return [];
      }

      const storeName = metadata?.storeName || credentials.storeName;
      const accessToken = credentials.accessToken;

      if (!storeName || !accessToken) {
        console.log('[Shopify] Missing credentials - storeName:', storeName, 'accessToken:', !!accessToken);
        return [];
      }

      console.log(`[Shopify] Creating ShopifyIntegration for store: ${storeName}`);
      const shopify = new ShopifyIntegration({
        storeName,
        accessToken,
      });

      console.log('[Shopify] Fetching campaign data...');
      const campaignData = await shopify.getCampaignData();

      if (!campaignData) {
        console.log('[Shopify] No campaign data returned');
        return [];
      }

      console.log('[Shopify] Campaign data received:', campaignData);
      return [{
        id: campaignData.id,
        name: campaignData.name,
        platform: 'shopify',
        status: campaignData.status,
        spend: campaignData.spend,
        clicks: campaignData.clicks,
        impressions: campaignData.impressions,
        conversions: campaignData.conversions,
        revenue: campaignData.revenue,
        metadata: campaignData.metadata,
      }];
    } catch (error) {
      console.error('[Shopify] Error in fetchShopifyData:', error);
      return [];
    }
  }

  private static async fetchGoogleAdsData(integration: any): Promise<PlatformCampaignData[]> {
    // TODO: Implement Google Ads integration
    // This would use Google Ads API to fetch campaign data
    console.log('Google Ads integration not yet implemented');
    return [];
  }

  private static async fetchMetaAdsData(integration: any): Promise<PlatformCampaignData[]> {
    // TODO: Implement Meta (Facebook) Ads integration
    // This would use Facebook Marketing API to fetch campaign data
    console.log('Meta Ads integration not yet implemented');
    return [];
  }

  private static async fetchLinkedInAdsData(integration: any): Promise<PlatformCampaignData[]> {
    // TODO: Implement LinkedIn Ads integration
    // This would use LinkedIn Marketing API to fetch campaign data
    console.log('LinkedIn Ads integration not yet implemented');
    return [];
  }

  static async fetchAllPlatformsData(
    userId: string,
    platformIds: string[]
  ): Promise<PlatformCampaignData[]> {
    const allCampaigns: PlatformCampaignData[] = [];

    for (const platformId of platformIds) {
      const platformData = await this.fetchPlatformData(userId, platformId);
      allCampaigns.push(...platformData);
    }

    return allCampaigns;
  }
}
