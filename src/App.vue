<template>
  <nav class="navbar no-print" v-if="!isShare">
    <router-link to="/" class="logo">Thread <span>&</span> Fate</router-link>
    <span style="color:var(--muted);font-size:0.8rem;font-family:var(--font-body)">Character Vault</span>
    <div class="nav-actions">
      <template v-if="auth.user">
        <span class="nav-email">{{ auth.user.email }}</span>
        <router-link to="/new" class="btn btn-primary btn-sm">+ New Character</router-link>
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

const auth = useAuthStore()
const route = useRoute()
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
</style>
