-- Update messages table for platform-based messaging
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS platform VARCHAR(50),
ADD COLUMN IF NOT EXISTS platform_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_profile_url TEXT,
ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS is_incoming BOOLEAN DEFAULT true;

-- Update status values for messages
UPDATE messages SET status = 'unread' WHERE status = 'sent';

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  post_id UUID REFERENCES posts(id),
  platform VARCHAR(50) NOT NULL,
  platform_comment_id VARCHAR(255),
  platform_post_id VARCHAR(255),
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  platform_profile_url TEXT,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  is_reply BOOLEAN DEFAULT false,
  sentiment VARCHAR(20),
  status VARCHAR(20) DEFAULT 'unread',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_user_platform ON messages(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_comments_platform ON comments(platform);
CREATE INDEX IF NOT EXISTS idx_comments_user_platform ON comments(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);