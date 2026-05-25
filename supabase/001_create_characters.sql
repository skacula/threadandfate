-- Thread & Fate: Characters table
-- Run this in the Supabase SQL editor to create the schema.

CREATE TABLE IF NOT EXISTS characters (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  archetype   TEXT DEFAULT '',
  world       TEXT DEFAULT '',
  player_name TEXT DEFAULT '',
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast listing sorted by most recently updated
CREATE INDEX IF NOT EXISTS idx_characters_updated_at ON characters (updated_at DESC);

-- Auto-bump updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
