<template>
  <div class="page">
    <!-- Header -->
    <div class="gm-header">
      <div>
        <h1 class="gm-title">GM Dashboard</h1>
        <p class="gm-sub">{{ gm.campaigns.length }} campaign{{ gm.campaigns.length !== 1 ? 's' : '' }}</p>
      </div>
      <button class="btn btn-primary" @click="showNewCampaign = true">+ New Campaign</button>
    </div>

    <!-- New campaign form -->
    <div v-if="showNewCampaign" class="panel">
      <div class="panel-head">Create Campaign</div>
      <form class="inline-form" @submit.prevent="createCampaign">
        <input v-model="newCampName" placeholder="Campaign name" required autofocus />
        <button class="btn btn-primary btn-sm" :disabled="createBusy">
          {{ createBusy ? 'Creating…' : 'Create' }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="showNewCampaign = false; newCampName = ''">
          Cancel
        </button>
      </form>
      <div v-if="createError" class="msg error" style="margin-top:8px">{{ createError }}</div>
    </div>

    <!-- Loading / error -->
    <div v-if="gm.loading" class="empty-state">Loading…</div>
    <div v-else-if="gm.error" class="msg error">{{ gm.error }}</div>

    <!-- No campaigns yet -->
    <div v-else-if="gm.campaigns.length === 0 && !showNewCampaign" class="empty-state">
      <div class="empty-icon">🎲</div>
      <h2>No campaigns yet</h2>
      <p>Create your first campaign to start inviting players.</p>
      <button class="btn btn-primary" style="margin-top:16px" @click="showNewCampaign = true">+ New Campaign</button>
    </div>

    <!-- Campaign sections -->
    <div v-else>
      <div v-for="camp in gm.campaigns" :key="camp.id" class="campaign-block">

        <!-- Campaign header row -->
        <div class="campaign-head">
          <template v-if="editingId === camp.id">
            <input class="camp-name-input" v-model="editName" @keydown.enter="saveRename(camp.id)" @keydown.escape="editingId = null" autofocus />
            <button class="btn btn-primary btn-sm" @click="saveRename(camp.id)">Save</button>
            <button class="btn btn-ghost btn-sm" @click="editingId = null">Cancel</button>
          </template>
          <template v-else>
            <span class="camp-name">{{ camp.name }}</span>
            <button class="btn btn-ghost btn-sm icon-btn" title="Rename" @click="startEdit(camp)">✏</button>
            <span class="camp-since">since {{ fmt(camp.createdAt) }}</span>
            <button class="btn btn-danger btn-sm" style="margin-left:auto" @click="deleteCampaign(camp)">
              Delete Campaign
            </button>
          </template>
        </div>

        <!-- Invite section -->
        <div class="invite-panel">
          <div class="invite-panel-head">
            <span>Invite Codes</span>
            <button class="btn btn-ghost btn-sm" :disabled="genBusy === camp.id" @click="generate(camp.id)">
              {{ genBusy === camp.id ? 'Generating…' : '+ Generate Code' }}
            </button>
          </div>

          <div v-if="camp.pendingCodes.length === 0" class="no-items">No active codes.</div>
          <div v-else class="code-list">
            <div v-for="c in camp.pendingCodes" :key="c.id" class="code-row">
              <span class="code-chip">{{ c.code }}</span>
              <span class="code-date">{{ fmt(c.createdAt) }}</span>
              <button class="btn btn-ghost btn-sm" @click="copyCode(c.code)">
                {{ copied === c.code ? '✓ Copied' : 'Copy' }}
              </button>
              <button class="btn btn-ghost btn-sm" @click="revokeCode(c.id)">Revoke</button>
            </div>
          </div>
        </div>

        <!-- Players section -->
        <div class="players-head">
          Players ({{ camp.players.length }})
        </div>

        <div v-if="camp.players.length === 0" class="no-items" style="margin-bottom:16px">
          No players yet — share an invite code above.
        </div>

        <div v-else>
          <div v-for="player in camp.players" :key="player.id" class="player-block">
            <div class="player-meta">
              <div>
                <div class="player-email">{{ player.email || player.id }}</div>
                <div v-if="player.displayName" class="player-name">{{ player.displayName }}</div>
              </div>
              <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="removePlayer(player.memberId, camp.id)">
                Remove
              </button>
            </div>

            <div v-if="player.characters.length === 0" class="no-items" style="margin-bottom:12px">
              No characters yet.
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGmStore } from '../stores/gm.js'

const gm     = useGmStore()
const router = useRouter()

const showNewCampaign = ref(false)
const newCampName     = ref('')
const createBusy      = ref(false)
const createError     = ref('')

const editingId = ref(null)
const editName  = ref('')

const genBusy = ref(null)
const copied  = ref('')

onMounted(() => gm.fetchCampaigns())

function go(id) { router.push(`/character/${id}`) }

async function createCampaign() {
  createError.value = ''
  createBusy.value  = true
  try {
    await gm.createCampaign(newCampName.value)
    showNewCampaign.value = false
    newCampName.value     = ''
  } catch (e) {
    createError.value = e.message
  } finally {
    createBusy.value = false
  }
}

function startEdit(camp) {
  editingId.value = camp.id
  editName.value  = camp.name
}

async function saveRename(campId) {
  if (!editName.value.trim()) return
  await gm.renameCampaign(campId, editName.value)
  editingId.value = null
}

async function deleteCampaign(camp) {
  if (!confirm(`Delete campaign "${camp.name}"? All invite codes and player links will be removed. Characters are not deleted.`)) return
  await gm.deleteCampaign(camp.id)
}

async function generate(campId) {
  genBusy.value = campId
  try {
    await gm.generateInviteCode(campId)
  } finally {
    genBusy.value = null
  }
}

async function revokeCode(memberId) {
  if (!confirm('Revoke this invite code?')) return
  await gm.revokeInvite(memberId)
}

async function removePlayer(memberId, campId) {
  const camp = gm.campaigns.find(c => c.id === campId)
  if (!confirm(`Remove this player from "${camp?.name ?? 'the campaign'}"?`)) return
  await gm.removePlayer(memberId)
}

async function copyCode(code) {
  await navigator.clipboard.writeText(code)
  copied.value = code
  setTimeout(() => { copied.value = '' }, 2000)
}

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.gm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
}
.gm-title { font-family: var(--font-title); font-size: 2rem; color: var(--acc); letter-spacing: 0.04em; }
.gm-sub   { color: var(--muted); font-size: 1rem; margin-top: 4px; }

/* New campaign panel */
.panel       { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px 24px; margin-bottom: 28px; }
.panel-head  { font-family: var(--font-title); font-size: 1rem; color: var(--white); letter-spacing: 0.04em; margin-bottom: 12px; }
.inline-form { display: flex; gap: 8px; flex-wrap: wrap; }
.inline-form input { flex: 1; min-width: 180px; }

/* Campaign blocks */
.campaign-block {
  margin-bottom: 40px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.campaign-head {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 14px 20px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.camp-name       { font-family: var(--font-title); font-size: 1.1rem; color: var(--white); letter-spacing: 0.04em; }
.camp-name-input { font-family: var(--font-title); font-size: 1rem; flex: 1; min-width: 160px; }
.camp-since      { font-size: 0.75rem; color: var(--faint); font-family: var(--font-mono); }
.icon-btn        { font-size: 0.8rem; padding: 3px 8px; }

/* Invite section inside campaign */
.invite-panel      { padding: 14px 20px; background: color-mix(in srgb, var(--acc) 4%, transparent); border-bottom: 1px solid var(--border); }
.invite-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem; color: var(--muted); }

.code-list { display: flex; flex-direction: column; gap: 6px; }
.code-row  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.code-chip {
  font-family: var(--font-mono); font-size: 0.95rem; letter-spacing: 0.18em;
  color: var(--acc); background: color-mix(in srgb, var(--acc) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 30%, transparent);
  border-radius: var(--r); padding: 3px 10px;
}
.code-date { font-size: 0.72rem; color: var(--faint); font-family: var(--font-mono); flex: 1; }
.no-items  { font-size: 0.82rem; color: var(--muted); padding: 4px 0; }

/* Players inside campaign */
.players-head { padding: 10px 20px 4px; font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

.player-block { padding: 0 20px 16px; }
.player-meta  {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 10px; padding: 8px 12px;
  background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r);
}
.player-email { font-family: var(--font-mono); font-size: 0.82rem; color: var(--white); }
.player-name  { font-size: 0.75rem; color: var(--muted); }

/* Character cards */
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
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
.char-card-content { position: relative; padding: 16px 18px; }
.gm-badge {
  display: inline-block;
  font-size: 0.62rem; font-family: var(--font-title); letter-spacing: 0.08em;
  color: var(--acc); background: color-mix(in srgb, var(--acc) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 35%, transparent);
  border-radius: 20px; padding: 2px 7px; margin-bottom: 7px;
}
.char-name  { font-family: var(--font-title); font-size: 1rem; color: var(--white); letter-spacing: 0.04em; margin-bottom: 3px; }
.char-arch  { font-size: 0.85rem; color: var(--acc); font-style: italic; margin-bottom: 2px; }
.char-world { font-size: 0.75rem; color: var(--muted); margin-bottom: 8px; }
.char-date  { font-size: 0.7rem; color: var(--faint); font-family: var(--font-mono); }

/* Misc */
.empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
.empty-icon  { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; }
.empty-state h2 { font-family: var(--font-title); font-size: 1.4rem; color: var(--faint); margin-bottom: 8px; }
.msg         { font-size: 0.85rem; padding: 8px 12px; border-radius: var(--r); }
.msg.error   { color: var(--fail-fg); background: color-mix(in srgb, var(--fail-fg) 10%, transparent); }
</style>
