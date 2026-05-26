<template>
  <nav class="navbar no-print" v-if="!isShare">
    <router-link to="/" class="logo">Thread <span>&</span> Fate</router-link>
    <span style="color:var(--muted);font-size:0.8rem;font-family:var(--font-body)">Character Vault</span>
    <div class="nav-actions">
      <template v-if="auth.user">
        <span class="role-badge" :class="auth.isGM ? 'badge-gm' : 'badge-player'">
          {{ auth.isGM ? 'Game Master' : 'Player' }}
        </span>
        <span class="nav-email">{{ auth.user.email }}</span>
        <router-link v-if="auth.isGM" to="/gm"  class="btn btn-ghost btn-sm">GM Dashboard</router-link>
        <router-link v-else            to="/new" class="btn btn-primary btn-sm">+ New Character</router-link>
        <button class="btn btn-ghost btn-sm" @click="logout">Sign Out</button>
      </template>
    </div>
  </nav>
  <router-view />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const isShare = computed(() => route.name === 'share' || route.name === 'login')

async function logout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.nav-email {
  font-size: 0.75rem;
  color: var(--muted);
  font-family: var(--font-mono);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.role-badge {
  font-size: 0.7rem;
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid;
}
.badge-gm     { color: var(--acc); border-color: color-mix(in srgb, var(--acc) 40%, transparent); background: color-mix(in srgb, var(--acc) 10%, transparent); }
.badge-player { color: var(--muted); border-color: var(--border); background: transparent; }
</style>
