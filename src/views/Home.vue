<template>
  <div class="page">
    <!-- GM redirect banner -->
    <div v-if="auth.isGM" class="gm-redirect">
      <span>You are logged in as a <strong>Game Master</strong>.</span>
      <router-link to="/gm" class="btn btn-primary btn-sm">Go to GM Dashboard →</router-link>
    </div>

    <div class="home-header">
      <div>
        <h1 class="home-title">Character Vault</h1>
        <p class="home-sub">Your Thread &amp; Fate roster — {{ store.list.length }} character{{ store.list.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/new" class="btn btn-primary">+ Create Character</router-link>
    </div>

    <div v-if="store.loading" class="empty-state">Loading…</div>

    <div v-else-if="store.list.length === 0" class="empty-state">
      <div class="empty-icon">⚔</div>
      <h2>No characters yet</h2>
      <p>Create your first Thread &amp; Fate character to begin your story.</p>
      <router-link to="/new" class="btn btn-primary" style="margin-top:16px">Create Character</router-link>
    </div>

    <div v-else class="char-grid">
      <div v-for="c in store.list" :key="c.id" class="char-card" @click="go(c.id)">
        <div class="char-card-bg"></div>
        <div class="char-card-content">
          <div class="char-name">{{ c.name || 'Unnamed' }}</div>
          <div class="char-arch">{{ c.archetype || '—' }}</div>
          <div class="char-world">{{ c.world || '' }}</div>
          <div class="char-footer">
            <span class="char-date">{{ fmt(c.updatedAt) }}</span>
            <button class="btn btn-danger btn-sm" @click.stop="del(c.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- GM Invite acceptance for players -->
    <div class="invite-section">
      <div class="invite-header">
        <span class="invite-title">Join a Game Master</span>
        <span class="invite-sub">Enter an invite code from your GM to link your characters.</span>
      </div>
      <form class="invite-form" @submit.prevent="acceptCode">
        <input
          v-model="inviteInput"
          placeholder="Enter invite code (e.g. AB3F2C1D)"
          maxlength="8"
          style="text-transform:uppercase;font-family:var(--font-mono);letter-spacing:0.12em"
        />
        <button class="btn btn-primary btn-sm" :disabled="inviteBusy || !inviteInput.trim()">
          {{ inviteBusy ? 'Joining…' : 'Join' }}
        </button>
      </form>
      <div v-if="inviteError"   class="invite-msg error">{{ inviteError }}</div>
      <div v-if="inviteSuccess" class="invite-msg success">Linked! Your GM can now view and update your characters.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character.js'
import { useAuthStore } from '../stores/auth.js'
import { useGmStore } from '../stores/gm.js'

const store  = useCharacterStore()
const auth   = useAuthStore()
const gm     = useGmStore()
const router = useRouter()

const inviteInput   = ref('')
const inviteBusy    = ref(false)
const inviteError   = ref('')
const inviteSuccess = ref(false)

onMounted(() => store.fetchList())

function go(id) { router.push(`/character/${id}`) }

async function del(id) {
  if (!confirm('Delete this character? This cannot be undone.')) return
  await store.remove(id)
}

async function acceptCode() {
  inviteError.value   = ''
  inviteSuccess.value = false
  inviteBusy.value    = true
  try {
    await gm.acceptInvite(inviteInput.value)
    inviteSuccess.value = true
    inviteInput.value   = ''
  } catch (e) {
    inviteError.value = e.message
  } finally {
    inviteBusy.value = false
  }
}

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
}
</script>

<style scoped>
.home-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
}
.home-title { font-family: var(--font-title); font-size: 2rem; color: var(--acc); letter-spacing: 0.04em; }
.home-sub { color: var(--muted); font-size: 1rem; margin-top: 4px; }

/* GM redirect banner */
.gm-redirect {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  background: color-mix(in srgb, var(--acc) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 30%, transparent);
  border-radius: var(--r);
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: var(--faint);
  flex-wrap: wrap;
}

.empty-state {
  text-align: center; padding: 80px 20px; color: var(--muted);
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; }
.empty-state h2 { font-family: var(--font-title); font-size: 1.4rem; color: var(--faint); margin-bottom: 8px; }

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
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
.char-card-content { position: relative; padding: 20px; }
.char-name {
  font-family: var(--font-title); font-size: 1.2rem;
  color: var(--white); letter-spacing: 0.04em; margin-bottom: 4px;
}
.char-arch { font-size: 0.9rem; color: var(--acc); margin-bottom: 2px; font-style: italic; }
.char-world { font-size: 0.8rem; color: var(--muted); margin-bottom: 16px; }
.char-footer { display: flex; align-items: center; justify-content: space-between; }
.char-date { font-size: 0.75rem; color: var(--faint); font-family: var(--font-mono); }

/* Invite section */
.invite-section {
  margin-top: 48px;
  border-top: 1px solid var(--border);
  padding-top: 28px;
}
.invite-header { margin-bottom: 14px; }
.invite-title {
  display: block;
  font-family: var(--font-title);
  font-size: 1rem;
  color: var(--faint);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.invite-sub { font-size: 0.85rem; color: var(--muted); }
.invite-form {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.invite-form input { flex: 1; min-width: 180px; max-width: 260px; }
.invite-msg { margin-top: 8px; font-size: 0.85rem; padding: 8px 12px; border-radius: var(--r); }
.invite-msg.error   { color: var(--fail-fg); background: color-mix(in srgb, var(--fail-fg) 10%, transparent); }
.invite-msg.success { color: var(--succ-fg); background: color-mix(in srgb, var(--succ-fg) 10%, transparent); }
</style>
