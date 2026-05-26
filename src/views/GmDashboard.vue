<template>
  <div class="page">
    <!-- Header -->
    <div class="gm-header">
      <div>
        <h1 class="gm-title">GM Dashboard</h1>
        <p class="gm-sub">{{ gm.players.length }} player{{ gm.players.length !== 1 ? 's' : '' }} linked to your table</p>
      </div>
    </div>

    <!-- Invite Players panel -->
    <div class="panel">
      <div class="panel-head">Invite Players</div>
      <p class="panel-sub">
        Generate a one-time code and share it with your player. They enter it on their
        Character Vault page to link their account to your table.
      </p>

      <button class="btn btn-primary btn-sm" :disabled="genBusy" @click="generate">
        {{ genBusy ? 'Generating…' : '+ Generate Invite Code' }}
      </button>
      <div v-if="genError" class="msg error" style="margin-top:8px">{{ genError }}</div>

      <!-- Active pending codes -->
      <div v-if="gm.pendingCodes.length" class="code-list">
        <div v-for="c in gm.pendingCodes" :key="c.id" class="code-row">
          <span class="code-chip">{{ c.code }}</span>
          <span class="code-date">{{ fmt(c.createdAt) }}</span>
          <button class="btn btn-ghost btn-sm" @click="revoke(c.id)">Revoke</button>
          <button class="btn btn-ghost btn-sm" @click="copy(c.code)">
            {{ copied === c.code ? '✓ Copied' : 'Copy' }}
          </button>
        </div>
      </div>
      <p v-else class="no-codes">No pending invite codes.</p>
    </div>

    <!-- Loading / error -->
    <div v-if="gm.loading" class="empty-state">Loading…</div>
    <div v-else-if="gm.error" class="msg error">{{ gm.error }}</div>

    <!-- Players list -->
    <template v-else>
      <div v-if="gm.players.length === 0" class="empty-state">
        <div class="empty-icon">🎲</div>
        <h2>No players yet</h2>
        <p>Generate an invite code above and share it with your players.</p>
      </div>

      <div v-else>
        <div class="section-head" style="margin-top:32px">Your Players</div>

        <div v-for="player in gm.players" :key="player.id" class="player-block">
          <div class="player-meta">
            <div class="player-email">{{ player.email || player.displayName || player.id }}</div>
            <div v-if="player.displayName && player.email" class="player-name">{{ player.displayName }}</div>
            <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="removePlayer(player.linkId)">
              Remove
            </button>
          </div>

          <!-- Player's characters -->
          <div v-if="player.characters.length === 0" class="no-chars">
            This player has no characters yet.
          </div>
          <div v-else class="char-grid">
            <div
              v-for="c in player.characters"
              :key="c.id"
              class="char-card"
              @click="go(c.id)"
            >
              <div class="char-card-bg"></div>
              <div class="char-card-content">
                <div class="gm-badge">GM Edit</div>
                <div class="char-name">{{ c.name || 'Unnamed' }}</div>
                <div class="char-arch">{{ c.archetype || '—' }}</div>
                <div class="char-world">{{ c.world || '' }}</div>
                <div class="char-date">{{ fmt(c.updatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGmStore } from '../stores/gm.js'

const gm     = useGmStore()
const router = useRouter()

const genBusy = ref(false)
const genError = ref('')
const copied  = ref('')

onMounted(() => gm.fetchPlayers())

function go(id) { router.push(`/character/${id}`) }

async function generate() {
  genError.value = ''
  genBusy.value  = true
  try {
    await gm.generateInviteCode()
  } catch (e) {
    genError.value = e.message
  } finally {
    genBusy.value = false
  }
}

async function revoke(id) {
  if (!confirm('Revoke this invite code?')) return
  await gm.revokeInvite(id)
}

async function removePlayer(linkId) {
  if (!confirm('Remove this player from your table? They will no longer be linked to you.')) return
  await gm.removePlayer(linkId)
}

async function copy(code) {
  await navigator.clipboard.writeText(code)
  copied.value = code
  setTimeout(() => { copied.value = '' }, 2000)
}

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
}
</script>

<style scoped>
.gm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
}
.gm-title { font-family: var(--font-title); font-size: 2rem; color: var(--acc); letter-spacing: 0.04em; }
.gm-sub   { color: var(--muted); font-size: 1rem; margin-top: 4px; }

/* Panel */
.panel {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px 24px;
  margin-bottom: 32px;
}
.panel-head {
  font-family: var(--font-title);
  font-size: 1rem;
  color: var(--white);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.panel-sub { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }

/* Invite code list */
.code-list  { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.code-row   { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.code-chip  {
  font-family: var(--font-mono); font-size: 1rem; letter-spacing: 0.18em;
  color: var(--acc); background: color-mix(in srgb, var(--acc) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 30%, transparent);
  border-radius: var(--r); padding: 4px 12px;
}
.code-date  { font-size: 0.75rem; color: var(--faint); font-family: var(--font-mono); flex: 1; }
.no-codes   { font-size: 0.85rem; color: var(--muted); margin-top: 12px; }

/* Player blocks */
.player-block { margin-bottom: 32px; }
.player-meta  {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--r);
}
.player-email { font-family: var(--font-mono); font-size: 0.85rem; color: var(--white); }
.player-name  { font-size: 0.8rem; color: var(--muted); }
.no-chars     { font-size: 0.85rem; color: var(--muted); padding: 12px 0; }

/* Character cards (same style as Home) */
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.char-card {
  position: relative; border-radius: var(--r-lg);
  border: 1px solid var(--border);
  overflow: hidden; cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
  background: var(--bg2);
}
.char-card:hover { border-color: var(--acc); transform: translateY(-2px); }
.char-card-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--crit-bg) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.2s;
}
.char-card:hover .char-card-bg { opacity: 1; }
.char-card-content { position: relative; padding: 18px 20px; }
.gm-badge {
  display: inline-block;
  font-size: 0.65rem; font-family: var(--font-title); letter-spacing: 0.08em;
  color: var(--acc); background: color-mix(in srgb, var(--acc) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 35%, transparent);
  border-radius: 20px; padding: 2px 8px; margin-bottom: 8px;
}
.char-name {
  font-family: var(--font-title); font-size: 1.1rem;
  color: var(--white); letter-spacing: 0.04em; margin-bottom: 3px;
}
.char-arch  { font-size: 0.88rem; color: var(--acc); font-style: italic; margin-bottom: 2px; }
.char-world { font-size: 0.78rem; color: var(--muted); margin-bottom: 10px; }
.char-date  { font-size: 0.72rem; color: var(--faint); font-family: var(--font-mono); }

/* Utility */
.empty-state { text-align:center; padding:60px 20px; color:var(--muted); }
.empty-icon  { font-size:3rem; margin-bottom:16px; opacity:0.3; }
.empty-state h2 { font-family:var(--font-title); font-size:1.4rem; color:var(--faint); margin-bottom:8px; }
.msg         { font-size:0.85rem; padding:8px 12px; border-radius:var(--r); }
.msg.error   { color:var(--fail-fg); background:color-mix(in srgb, var(--fail-fg) 10%, transparent); }
</style>
