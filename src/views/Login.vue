<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-logo">Thread <span>&</span> Fate</div>
      <div class="login-sub">Character Vault</div>

      <div class="login-tabs">
        <button :class="['tab-btn', { active: mode === 'signin' }]" @click="mode = 'signin'">Sign In</button>
        <button :class="['tab-btn', { active: mode === 'signup' }]" @click="mode = 'signup'">Create Account</button>
      </div>

      <form @submit.prevent="submit">
        <div class="field-group">
          <label class="field-label">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="field-group">
          <label class="field-label">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required autocomplete="current-password" minlength="6" />
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>
        <div v-if="notice" class="login-notice">{{ notice }}</div>

        <button class="btn btn-primary" style="width:100%;margin-top:8px" :disabled="busy">
          {{ busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  notice.value = ''
  busy.value = true
  try {
    if (mode.value === 'signin') {
      await auth.signIn(email.value, password.value)
      router.push('/')
    } else {
      await auth.signUp(email.value, password.value)
      notice.value = 'Account created! Check your email to confirm, then sign in.'
      mode.value = 'signin'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg);
}
.login-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 40px 36px;
  width: 100%;
  max-width: 420px;
}
.login-logo {
  font-family: var(--font-title);
  font-size: 1.8rem;
  color: var(--acc);
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: 4px;
}
.login-logo span { color: var(--white); }
.login-sub {
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 28px;
  font-family: var(--font-body);
}
.login-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: var(--bg);
  border-radius: var(--r);
  padding: 4px;
}
.login-tabs .tab-btn {
  flex: 1;
  padding: 8px;
  font-size: 0.85rem;
}
.login-error {
  color: var(--fail-fg);
  font-size: 0.85rem;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--fail-fg) 10%, transparent);
  border-radius: var(--r);
}
.login-notice {
  color: var(--succ-fg);
  font-size: 0.85rem;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--succ-fg) 10%, transparent);
  border-radius: var(--r);
}
</style>
