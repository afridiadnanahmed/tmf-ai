-- Add recipientEmail column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);

-- Update existing messages to set recipientEmail based on contactId
UPDATE messages m
SET recipient_email = c.email
FROM contacts c
WHERE m.contact_id = c.id
AND m.recipient_email IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient_email ON messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);