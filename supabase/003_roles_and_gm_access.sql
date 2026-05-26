-- Adds user roles (player/game_master) and GM-player invite system.
-- Run this in the Supabase SQL editor after 002_add_auth_and_sharing.sql.

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

-- ─── GM–Player access table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gm_player_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(encode(gen_random_bytes(4), 'hex')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_player_gm      ON gm_player_access(gm_id);
CREATE INDEX IF NOT EXISTS idx_gm_player_player  ON gm_player_access(player_id);
CREATE INDEX IF NOT EXISTS idx_gm_player_code    ON gm_player_access(invite_code);

-- ─── RLS: profiles ──────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can always read and update their own profile.
CREATE POLICY "profiles_own_read"   ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- GMs can read profiles of their accepted players.
CREATE POLICY "gm_read_player_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT player_id FROM gm_player_access
      WHERE gm_id = auth.uid() AND status = 'accepted'
    )
  );

-- Players can read profiles of their GMs.
CREATE POLICY "player_read_gm_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT gm_id FROM gm_player_access
      WHERE player_id = auth.uid() AND status = 'accepted'
    )
  );

-- ─── RLS: gm_player_access ──────────────────────────────────────────────────

ALTER TABLE gm_player_access ENABLE ROW LEVEL SECURITY;

-- GMs fully manage their own invite/access rows.
CREATE POLICY "gms_manage_own_access" ON gm_player_access FOR ALL TO authenticated
  USING (gm_id = auth.uid()) WITH CHECK (gm_id = auth.uid());

-- Players can view links they have been accepted into.
CREATE POLICY "players_view_own_links" ON gm_player_access FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- Any authenticated user may look up a pending, unclaimed invite by code.
-- The invite_code acts as a shared secret; knowing it is sufficient authorization.
CREATE POLICY "lookup_pending_invites" ON gm_player_access FOR SELECT TO authenticated
  USING (status = 'pending' AND player_id IS NULL);

-- A player may accept a pending invite by writing their own id into player_id.
CREATE POLICY "players_accept_invites" ON gm_player_access FOR UPDATE TO authenticated
  USING  (status = 'pending' AND player_id IS NULL)
  WITH CHECK (player_id = auth.uid() AND status = 'accepted');

-- ─── RLS: characters (add GM policies) ──────────────────────────────────────

-- GMs can read characters belonging to their accepted players.
CREATE POLICY "gm_read_player_characters" ON characters FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT player_id FROM gm_player_access
      WHERE gm_id = auth.uid() AND status = 'accepted'
    )
  );

-- GMs can update (not insert or delete) those characters without changing ownership.
CREATE POLICY "gm_update_player_characters" ON characters FOR UPDATE TO authenticated
  USING (
    user_id IN (
      SELECT player_id FROM gm_player_access
      WHERE gm_id = auth.uid() AND status = 'accepted'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT player_id FROM gm_player_access
      WHERE gm_id = auth.uid() AND status = 'accepted'
    )
  );
