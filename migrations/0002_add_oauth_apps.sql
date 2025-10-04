-- Create oauth_apps table
CREATE TABLE IF NOT EXISTS oauth_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT,
  redirect_uri TEXT,
  scopes JSONB,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add oauth_app_id to integrations table
ALTER TABLE integrations ADD COLUMN oauth_app_id UUID REFERENCES oauth_apps(id);

-- Create index for faster lookups
CREATE INDEX idx_oauth_apps_user_platform ON oauth_apps(user_id, platform);
CREATE INDEX idx_integrations_oauth_app_id ON integrations(oauth_app_id);