-- Adds user roles, named campaigns, and GM-player invite system.
-- Run this in the Supabase SQL editor after 002_add_auth_and_sharing.sql.
-- Safe to re-run: all policy and trigger drops are IF EXISTS.

-- ─── Profiles table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'game_master')),
  display_name TEXT,
  email        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new auth user signs up.
-- The desired role is read from raw_user_meta_data set at sign-up time.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Campaigns table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Unnamed Campaign',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_gm_id ON campaigns(gm_id);

-- ─── Campaign members table ───────────────────────────────────────────────────
-- Each row represents either a pending invite code or an accepted player slot
-- within a specific campaign.

CREATE TABLE IF NOT EXISTS campaign_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  player_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(encode(gen_random_bytes(4), 'hex')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cm_campaign  ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cm_player    ON campaign_members(player_id);
CREATE INDEX IF NOT EXISTS idx_cm_code      ON campaign_members(invite_code);

-- ─── RLS: profiles ──────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_read"          ON profiles;
DROP POLICY IF EXISTS "profiles_own_update"         ON profiles;
DROP POLICY IF EXISTS "gm_read_player_profiles"     ON profiles;
DROP POLICY IF EXISTS "player_read_gm_profiles"     ON profiles;

CREATE POLICY "profiles_own_read"   ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- GMs can read profiles of players in their campaigns.
CREATE POLICY "gm_read_player_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT cm.player_id
      FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE c.gm_id = auth.uid() AND cm.status = 'accepted'
    )
  );

-- Players can read profiles of GMs whose campaigns they have joined.
CREATE POLICY "player_read_gm_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT c.gm_id
      FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE cm.player_id = auth.uid() AND cm.status = 'accepted'
    )
  );

-- ─── RLS: campaigns ──────────────────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gms_manage_own_campaigns"      ON campaigns;
DROP POLICY IF EXISTS "player_read_joined_campaigns"  ON campaigns;

-- GMs fully manage their own campaigns.
CREATE POLICY "gms_manage_own_campaigns" ON campaigns FOR ALL TO authenticated
  USING (gm_id = auth.uid()) WITH CHECK (gm_id = auth.uid());

-- Players can read campaigns they are accepted members of.
CREATE POLICY "player_read_joined_campaigns" ON campaigns FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT campaign_id FROM campaign_members
      WHERE player_id = auth.uid() AND status = 'accepted'
    )
  );

-- ─── Helper: break RLS recursion between campaigns ↔ campaign_members ────────
-- campaigns.player_read_joined_campaigns queries campaign_members, and
-- campaign_members.gms_manage_campaign_members queries campaigns — a cycle.
-- This SECURITY DEFINER function queries campaigns bypassing its RLS policies,
-- so the chain terminates.

DROP FUNCTION IF EXISTS is_campaign_gm(UUID) CASCADE;
CREATE OR REPLACE FUNCTION is_campaign_gm(cid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM campaigns WHERE id = cid AND gm_id = auth.uid());
$$;

-- ─── RLS: campaign_members ───────────────────────────────────────────────────

ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gms_manage_campaign_members"  ON campaign_members;
DROP POLICY IF EXISTS "players_view_own_membership"  ON campaign_members;
DROP POLICY IF EXISTS "lookup_pending_invites"        ON campaign_members;
DROP POLICY IF EXISTS "players_accept_invites"        ON campaign_members;

-- GMs manage all member rows for their own campaigns.
-- Uses is_campaign_gm() (SECURITY DEFINER) to avoid recursion with
-- campaigns.player_read_joined_campaigns, which also queries campaign_members.
CREATE POLICY "gms_manage_campaign_members" ON campaign_members FOR ALL TO authenticated
  USING  (is_campaign_gm(campaign_id))
  WITH CHECK (is_campaign_gm(campaign_id));

-- Players can view member rows they are accepted into.
CREATE POLICY "players_view_own_membership" ON campaign_members FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- Any authenticated user may look up a pending, unclaimed invite by code.
-- The invite_code is a shared secret; knowing it is sufficient authorization.
CREATE POLICY "lookup_pending_invites" ON campaign_members FOR SELECT TO authenticated
  USING (status = 'pending' AND player_id IS NULL);

-- A player may accept a pending invite by writing their own id into player_id.
CREATE POLICY "players_accept_invites" ON campaign_members FOR UPDATE TO authenticated
  USING  (status = 'pending' AND player_id IS NULL)
  WITH CHECK (player_id = auth.uid() AND status = 'accepted');

-- ─── RLS: characters (GM policies via campaigns) ─────────────────────────────

DROP POLICY IF EXISTS "gm_read_player_characters"   ON characters;
DROP POLICY IF EXISTS "gm_update_player_characters" ON characters;

-- GMs can read characters belonging to players in their campaigns.
CREATE POLICY "gm_read_player_characters" ON characters FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT cm.player_id
      FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE c.gm_id = auth.uid() AND cm.status = 'accepted'
    )
  );

-- GMs can update (not insert or delete) those characters without changing ownership.
CREATE POLICY "gm_update_player_characters" ON characters FOR UPDATE TO authenticated
  USING (
    user_id IN (
      SELECT cm.player_id
      FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE c.gm_id = auth.uid() AND cm.status = 'accepted'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT cm.player_id
      FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE c.gm_id = auth.uid() AND cm.status = 'accepted'
    )
  );

-- ─── Table-level grants ───────────────────────────────────────────────────────
-- Tables created via raw SQL don't get auto-grants the way Dashboard tables do.
-- Without these, authenticated users get "permission denied" even when an RLS
-- policy would otherwise allow the row.

GRANT SELECT, INSERT, UPDATE ON profiles        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_members TO authenticated;
