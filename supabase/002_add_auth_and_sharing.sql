-- Add auth ownership and public sharing support to characters.
-- Run this in the Supabase SQL editor after 001_create_characters.sql.

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters (user_id);
CREATE INDEX IF NOT EXISTS idx_characters_share_token ON characters (share_token) WHERE share_token IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do all CRUD on rows they own
CREATE POLICY "users_manage_own" ON characters
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone (anon or authenticated) can read a character that has been shared
CREATE POLICY "public_share_view" ON characters
  FOR SELECT TO anon, authenticated
  USING (share_token IS NOT NULL);
