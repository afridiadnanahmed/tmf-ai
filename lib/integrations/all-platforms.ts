// Consolidated platforms configuration
// Types and platform definitions in one file to avoid circular dependencies

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
  redirectUri?: string;
}

export interface ApiKeyField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface IntegrationPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  category: string;
  oauthConfig?: OAuthConfig;
  requiresOAuth: boolean;
  requiresApiKey?: boolean;
  apiKeyFields?: ApiKeyField[];
  setupInstructions?: string;
}

export const PLATFORMS: IntegrationPlatform[] = [
  // ============================================
  // AD PLATFORMS
  // ============================================

  {
    id: 'metaAds',
    name: 'Meta Ads',
    description: 'Facebook and Instagram advertising platform',
    icon: '📊',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'googleAds',
    name: 'Google Ads',
    description: 'Search, display, and video advertising',
    icon: '🔍',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'tiktokAds',
    name: 'TikTok Ads',
    description: 'TikTok advertising campaigns',
    icon: '🎬',
    iconColor: 'text-black',
    bgColor: 'bg-gray-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'linkedinAds',
    name: 'LinkedIn Ads',
    description: 'B2B advertising on LinkedIn',
    icon: '💼',
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'twitterAds',
    name: 'X Ads',
    description: 'Advertising on X (Twitter)',
    icon: '🎯',
    iconColor: 'text-black',
    bgColor: 'bg-gray-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'snapchatAds',
    name: 'Snapchat Ads',
    description: 'Mobile-first advertising',
    icon: '👻',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'pinterestAds',
    name: 'Pinterest Ads',
    description: 'Visual discovery ads',
    icon: '📌',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'redditAds',
    name: 'Reddit Ads',
    description: 'Community-driven advertising',
    icon: '🤖',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'amazonAds',
    name: 'Amazon Ads',
    description: 'Amazon marketplace advertising',
    icon: '📦',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'youtubeAds',
    name: 'YouTube Ads',
    description: 'Video advertising on YouTube',
    icon: '▶️',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'spotifyAds',
    name: 'Spotify Ads',
    description: 'Audio advertising on Spotify',
    icon: '🎵',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'bingAds',
    name: 'Microsoft Ads',
    description: 'Bing and Microsoft advertising',
    icon: '🔷',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'Ad Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },

  // ============================================
  // ANALYTICS TOOLS
  // ============================================

  {
    id: 'googleAnalytics',
    name: 'Google Analytics',
    description: 'Website traffic and behavior analytics',
    icon: '📈',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'Additional Analytics Tools',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics platform',
    icon: '📊',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'Additional Analytics Tools',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'projectId',
        label: 'Project ID',
        type: 'text',
        placeholder: 'Your Mixpanel project ID',
        required: true,
      },
      {
        name: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        placeholder: 'Your API secret',
        required: true,
      },
    ],
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    description: 'Product intelligence platform',
    icon: '📱',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'Additional Analytics Tools',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your Amplitude API key',
        required: true,
      },
      {
        name: 'secretKey',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'Your secret key',
        required: true,
      },
    ],
  },
  {
    id: 'segment',
    name: 'Segment',
    description: 'Customer data platform',
    icon: '🔄',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'Additional Analytics Tools',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'writeKey',
        label: 'Write Key',
        type: 'password',
        placeholder: 'Your Segment write key',
        required: true,
      },
    ],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'User behavior analytics',
    icon: '🔥',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'Additional Analytics Tools',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'siteId',
        label: 'Site ID',
        type: 'text',
        placeholder: 'Your Hotjar site ID',
        required: true,
      },
    ],
  },

  // ============================================
  // CRM PLATFORMS
  // ============================================

  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing and CRM',
    icon: '🎯',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'CRM & Sales Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM platform',
    icon: '☁️',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'CRM & Sales Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales-focused CRM',
    icon: '🎯',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'CRM & Sales Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        placeholder: 'Your Pipedrive API token',
        required: true,
      },
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Complete CRM solution',
    icon: '📊',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'CRM & Sales Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },

  // ============================================
  // EMAIL MARKETING
  // ============================================

  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    icon: '🐵',
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'Email Marketing & Automation',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery service',
    icon: '📧',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'Email Marketing & Automation',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your SendGrid API key',
        required: true,
      },
    ],
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'E-commerce email marketing',
    icon: '💌',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'Email Marketing & Automation',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'company',
        label: 'Company',
        type: 'text',
        placeholder: 'Your company name',
        required: true,
      },
      {
        name: 'privateKey',
        label: 'Private API Key',
        type: 'password',
        placeholder: 'pk_...',
        required: true,
      },
    ],
  },
  {
    id: 'brevo',
    name: 'Brevo',
    description: 'Email and SMS marketing',
    icon: '✉️',
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    category: 'Email Marketing & Automation',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your Brevo API key',
        required: true,
      },
    ],
  },

  // ============================================
  // SOCIAL MEDIA PLATFORMS
  // ============================================

  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Facebook pages and insights',
    icon: '👍',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Instagram business accounts',
    icon: '📷',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'X posts and analytics',
    icon: '🐦',
    iconColor: 'text-black',
    bgColor: 'bg-gray-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn company pages',
    icon: '💼',
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'TikTok business accounts',
    icon: '🎵',
    iconColor: 'text-black',
    bgColor: 'bg-gray-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'YouTube channel analytics',
    icon: '📺',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'Social Media Management & Listening',
    requiresOAuth: true,
    requiresApiKey: false,
  },

  // ============================================
  // E-COMMERCE PLATFORMS
  // ============================================

  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform',
    icon: '🛍️',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'E-commerce Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    setupInstructions: 'Create a custom app in your Shopify admin (Settings > Apps and sales channels > Develop apps). Make sure to grant the "read_analytics" scope to access analytics data.',
    apiKeyFields: [
      {
        name: 'storeName',
        label: 'Store Name',
        type: 'text',
        placeholder: 'your-store.myshopify.com',
        required: true,
      },
      {
        name: 'accessToken',
        label: 'Admin API Access Token',
        type: 'password',
        placeholder: 'shpat_...',
        required: true,
      },
    ],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce',
    icon: '🛒',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'E-commerce Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'url',
        label: 'Store URL',
        type: 'text',
        placeholder: 'https://yourstore.com',
        required: true,
      },
      {
        name: 'consumerKey',
        label: 'Consumer Key',
        type: 'text',
        placeholder: 'ck_...',
        required: true,
      },
      {
        name: 'consumerSecret',
        label: 'Consumer Secret',
        type: 'password',
        placeholder: 'cs_...',
        required: true,
      },
    ],
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Enterprise e-commerce platform',
    icon: '🛍️',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'E-commerce Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'url',
        label: 'Store URL',
        type: 'text',
        placeholder: 'https://yourstore.com',
        required: true,
      },
      {
        name: 'accessToken',
        label: 'Access Token',
        type: 'password',
        placeholder: 'Your Magento access token',
        required: true,
      },
    ],
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'Scalable e-commerce solution',
    icon: '🏪',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'E-commerce Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'storeHash',
        label: 'Store Hash',
        type: 'text',
        placeholder: 'Your store hash',
        required: true,
      },
      {
        name: 'accessToken',
        label: 'Access Token',
        type: 'password',
        placeholder: 'Your BigCommerce access token',
        required: true,
      },
    ],
  },
  {
    id: 'wix',
    name: 'Wix eCommerce',
    description: 'Wix online store platform',
    icon: '🎨',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'E-commerce Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },

  // ============================================
  // PAYMENT & BILLING
  // ============================================

  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    icon: '💳',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'E-commerce Platforms',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'secretKey',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'sk_...',
        required: true,
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        options: [
          { value: 'test', label: 'Test' },
          { value: 'live', label: 'Live' },
        ],
      },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Payment processing',
    icon: '💰',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'E-commerce Platforms',
    requiresOAuth: true,
    requiresApiKey: false,
  },

  // ============================================
  // COMMUNICATION PLATFORMS
  // ============================================

  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communication',
    icon: '📱',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'Customer Support & Engagement',
    requiresOAuth: false,
    requiresApiKey: true,
    apiKeyFields: [
      {
        name: 'accountSid',
        label: 'Account SID',
        type: 'text',
        placeholder: 'AC...',
        required: true,
      },
      {
        name: 'authToken',
        label: 'Auth Token',
        type: 'password',
        placeholder: 'Your auth token',
        required: true,
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication',
    icon: '💬',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'Customer Support & Engagement',
    requiresOAuth: true,
    requiresApiKey: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community communication',
    icon: '🎮',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'Customer Support & Engagement',
    requiresOAuth: true,
    requiresApiKey: false,
  },
];

// OAuth configuration helper (returns null for dynamic configuration)
export function getOAuthConfig(platform: string): OAuthConfig | null {
  // In the dynamic OAuth system, configurations come from the database
  // This function is kept for backward compatibility but returns null
  return null;
}