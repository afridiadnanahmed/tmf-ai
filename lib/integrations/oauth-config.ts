import { OAuthConfig, ApiKeyField, IntegrationPlatform } from './types';
import { ALL_PLATFORMS } from './platforms-config';

// Re-export types for backward compatibility
export type { OAuthConfig, ApiKeyField, IntegrationPlatform };

// Export the comprehensive platform list
export const PLATFORMS: IntegrationPlatform[] = ALL_PLATFORMS;

// OAuth configurations for platforms
const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  // Meta Platforms (Facebook, Instagram, WhatsApp)
  facebook: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: ['pages_show_list', 'pages_messaging', 'pages_read_engagement', 'pages_manage_posts'],
  },
  instagram: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'],
  },
  metaAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: ['ads_management', 'ads_read', 'business_management'],
  },
  whatsapp: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: ['whatsapp_business_management', 'whatsapp_business_messaging'],
  },
  
  // Google Platforms
  googleAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: ['https://www.googleapis.com/auth/adwords'],
  },
  googleAnalytics: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: ['https://www.googleapis.com/auth/analytics.readonly'],
  },
  youtubeAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.force-ssl'],
  },
  googleSearchConsole: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
  },
  googleTagManager: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: ['https://www.googleapis.com/auth/tagmanager.readonly'],
  },
  
  // LinkedIn
  linkedin: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: ['openid', 'profile', 'email', 'w_member_social'],
  },
  linkedinAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: ['r_ads', 'r_ads_reporting', 'rw_ads'],
  },
  
  // Twitter/X
  twitter: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    scope: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
  },
  twitterAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    scope: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
  },
  
  // TikTok
  tiktok: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scope: ['user.info.basic', 'video.list'],
  },
  tiktokAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scope: [],
  },
  
  // Other Social Platforms
  pinterest: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scope: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
  },
  pinterestAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scope: ['ads:read', 'ads:write'],
  },
  snapchat: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
    tokenUrl: 'https://accounts.snapchat.com/login/oauth2/access_token',
    scope: ['snapchat-marketing-api'],
  },
  snapchatAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
    tokenUrl: 'https://accounts.snapchat.com/login/oauth2/access_token',
    scope: ['snapchat-marketing-api'],
  },
  reddit: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scope: ['identity', 'submit', 'read'],
  },
  redditAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scope: ['identity', 'adsread'],
  },
  discord: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scope: ['identify', 'guilds'],
  },
  
  // Email Marketing Platforms
  mailchimp: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    scope: [],
  },
  constantContact: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://authz.constantcontact.com/oauth2/default/v1/authorize',
    tokenUrl: 'https://authz.constantcontact.com/oauth2/default/v1/token',
    scope: ['contact_data', 'campaign_data'],
  },
  drip: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.getdrip.com/oauth/authorize',
    tokenUrl: 'https://www.getdrip.com/oauth/token',
    scope: [],
  },
  
  // CRM Platforms
  hubspot: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scope: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
  },
  salesforce: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scope: ['api', 'refresh_token'],
  },
  zohoCRM: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    scope: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL'],
  },
  dynamics365: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: ['https://graph.microsoft.com/.default'],
  },
  monday: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://auth.monday.com/oauth2/authorize',
    tokenUrl: 'https://auth.monday.com/oauth2/token',
    scope: ['me:read', 'boards:read', 'boards:write'],
  },
  
  // E-commerce Platforms
  bigcommerce: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.bigcommerce.com/oauth2/authorize',
    tokenUrl: 'https://login.bigcommerce.com/oauth2/token',
    scope: ['store_v2_content', 'store_v2_products'],
  },
  squarespace: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.squarespace.com/api/1/login/oauth/provider/authorize',
    tokenUrl: 'https://login.squarespace.com/api/1/login/oauth/provider/tokens',
    scope: ['website.orders.read', 'website.products.read'],
  },
  wixEcommerce: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.wix.com/oauth/authorize',
    tokenUrl: 'https://www.wix.com/oauth/token',
    scope: ['offline_access'],
  },
  etsy: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.etsy.com/oauth/connect',
    tokenUrl: 'https://api.etsy.com/v3/public/oauth/token',
    scope: ['transactions_r', 'listings_r'],
  },
  ebay: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://auth.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    scope: ['https://api.ebay.com/oauth/api_scope/sell.inventory'],
  },
  magento: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.magento.com/oauth/authorize',
    tokenUrl: 'https://www.magento.com/oauth/token',
    scope: [],
  },
  
  // Ad Platforms
  amazonAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.amazon.com/ap/oa',
    tokenUrl: 'https://api.amazon.com/auth/o2/token',
    scope: ['advertising::campaign_management'],
  },
  microsoftAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: ['https://ads.microsoft.com/.default'],
  },
  spotifyAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scope: ['user-read-email'],
  },
  quoraAds: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://www.quora.com/oauth/authorize',
    tokenUrl: 'https://www.quora.com/oauth/token',
    scope: [],
  },
  
  // Social Media Management
  hootsuite: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://platform.hootsuite.com/oauth2/auth',
    tokenUrl: 'https://platform.hootsuite.com/oauth2/token',
    scope: ['offline'],
  },
  sproutSocial: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://api.sproutsocial.com/oauth/authorize',
    tokenUrl: 'https://api.sproutsocial.com/oauth/token',
    scope: [],
  },
  buffer: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://bufferapp.com/oauth2/authorize',
    tokenUrl: 'https://api.bufferapp.com/1/oauth2/token.json',
    scope: [],
  },
  
  // Customer Support
  zendesk: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    scope: ['read', 'write'],
  },
  intercom: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://app.intercom.com/oauth',
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    scope: [],
  },
  liveChat: {
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://accounts.livechat.com/oauth/authorize',
    tokenUrl: 'https://accounts.livechat.com/oauth/token',
    scope: ['agents--all:ro', 'archives--all:ro'],
  },
};

// Get OAuth config with environment variables
export function getOAuthConfig(platform: string): OAuthConfig | null {
  const baseConfig = OAUTH_CONFIGS[platform];
  if (!baseConfig) return null;
  
  // Map platform IDs to environment variable prefixes
  const envPrefixMap: Record<string, string> = {
    // Social Media
    'facebook': 'FACEBOOK',
    'instagram': 'INSTAGRAM',
    'twitter': 'TWITTER',
    'linkedin': 'LINKEDIN',
    'tiktok': 'TIKTOK',
    'pinterest': 'PINTEREST',
    'snapchat': 'SNAPCHAT',
    'reddit': 'REDDIT',
    'discord': 'DISCORD',
    'whatsapp': 'WHATSAPP',
    // Advertising
    'metaAds': 'METAADS',
    'googleAds': 'GOOGLEADS',
    'youtubeAds': 'YOUTUBEADS',
    'linkedinAds': 'LINKEDINADS',
    'twitterAds': 'TWITTERADS',
    'tiktokAds': 'TIKTOKADS',
    'snapchatAds': 'SNAPCHATADS',
    'pinterestAds': 'PINTERESTADS',
    'amazonAds': 'AMAZONADS',
    'microsoftAds': 'MICROSOFTADS',
    'spotifyAds': 'SPOTIFYADS',
    'redditAds': 'REDDITADS',
    'quoraAds': 'QUORAADS',
    // Analytics
    'googleAnalytics': 'GOOGLEANALYTICS',
    'googleSearchConsole': 'GOOGLESEARCHCONSOLE',
    'googleTagManager': 'GOOGLETAGMANAGER',
    // Email & CRM
    'mailchimp': 'MAILCHIMP',
    'constantContact': 'CONSTANTCONTACT',
    'drip': 'DRIP',
    'hubspot': 'HUBSPOT',
    'salesforce': 'SALESFORCE',
    'zohoCRM': 'ZOHOCRM',
    'dynamics365': 'DYNAMICS365',
    'monday': 'MONDAY',
    // E-commerce
    'bigcommerce': 'BIGCOMMERCE',
    'squarespace': 'SQUARESPACE',
    'wixEcommerce': 'WIXECOMMERCE',
    'etsy': 'ETSY',
    'ebay': 'EBAY',
    'magento': 'MAGENTO',
    // Social Media Management
    'hootsuite': 'HOOTSUITE',
    'sproutSocial': 'SPROUTSOCIAL',
    'buffer': 'BUFFER',
    // Customer Support
    'zendesk': 'ZENDESK',
    'intercom': 'INTERCOM',
    'liveChat': 'LIVECHAT',
  };
  
  const envPrefix = envPrefixMap[platform] || platform.toUpperCase();
  
  // Check environment variables (only for OAuth platforms)
  const envClientId = process.env[`${envPrefix}_CLIENT_ID`];
  const envClientSecret = process.env[`${envPrefix}_CLIENT_SECRET`];
  
  // Only return config if both credentials are set
  if (!envClientId || !envClientSecret) {
    // Don't warn for API key platforms
    const platformConfig = PLATFORMS.find(p => p.id === platform);
    if (platformConfig?.requiresOAuth) {
      console.warn(`OAuth credentials not configured for ${platform}. Please set ${envPrefix}_CLIENT_ID and ${envPrefix}_CLIENT_SECRET environment variables.`);
    }
    return null;
  }
  
  return {
    ...baseConfig,
    clientId: envClientId,
    clientSecret: envClientSecret,
  };
}