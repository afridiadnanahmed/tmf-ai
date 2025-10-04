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
  oauthConfig?: OAuthConfig;
  requiresOAuth: boolean;
  requiresApiKey?: boolean;
  apiKeyFields?: ApiKeyField[];
  setupInstructions?: string;
}