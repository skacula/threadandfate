import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const role    = ref(null)   // 'player' | 'game_master' | null
  const loading = ref(true)

  const isGM = computed(() => role.value === 'game_master')

  async function fetchRole() {
    if (!user.value) { role.value = null; return }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()
    role.value = data?.role ?? 'player'
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) await fetchRole()
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      await fetchRole()
    })
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchRole()
  }

  async function signUp(email, password, selectedRole = 'player') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: selectedRole } }
    })
    if (error) throw error
    user.value = data.user
    // Profile is created by a DB trigger from raw_user_meta_data.
    // Reflect the chosen role locally so the UI responds immediately.
    role.value = selectedRole
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    role.value = null
  }

  return { user, role, loading, isGM, init, signIn, signUp, signOut, fetchRole }
})
