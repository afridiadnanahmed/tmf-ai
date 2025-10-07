-- Add image column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image TEXT;
