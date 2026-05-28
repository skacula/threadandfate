-- Links characters to a specific campaign so players can see which adventure
-- a character belongs to. Run after 003_roles_and_gm_access.sql.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards throughout.

-- ─── Add campaign_id to characters ──────────────────────────────────────────

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);

-- ─── Table-level grant (column is new, no separate grant needed) ─────────────
-- The existing GRANT on characters already covers all columns including campaign_id.
