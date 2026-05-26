import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './auth.js'

export const useGmStore = defineStore('gm', () => {
  const players      = ref([])  // [{ linkId, id, email, displayName, characters[] }]
  const pendingCodes = ref([])  // [{ id, invite_code, created_at }]
  const loading      = ref(false)
  const error        = ref(null)

  async function fetchPlayers() {
    loading.value = true
    error.value = null
    try {
      const auth = useAuthStore()

      // All access rows for this GM (both pending and accepted)
      const { data: links, error: linksErr } = await supabase
        .from('gm_player_access')
        .select('id, player_id, invite_code, status, created_at')
        .eq('gm_id', auth.user.id)
        .order('created_at', { ascending: false })
      if (linksErr) throw linksErr

      const accepted = links.filter(l => l.status === 'accepted' && l.player_id)
      const pending  = links.filter(l => l.status === 'pending')

      pendingCodes.value = pending.map(l => ({ id: l.id, code: l.invite_code, createdAt: l.created_at }))

      if (accepted.length === 0) {
        players.value = []
        return
      }

      const playerIds = accepted.map(l => l.player_id)

      const [profilesResult, charsResult] = await Promise.all([
        supabase.from('profiles').select('id, display_name, email').in('id', playerIds),
        supabase
          .from('characters')
          .select('id, name, archetype, world, user_id, updated_at')
          .in('user_id', playerIds)
          .order('updated_at', { ascending: false })
      ])

      if (profilesResult.error) throw profilesResult.error
      if (charsResult.error)    throw charsResult.error

      const profileMap = Object.fromEntries(profilesResult.data.map(p => [p.id, p]))

      players.value = accepted.map(link => {
        const profile    = profileMap[link.player_id] || {}
        const characters = charsResult.data
          .filter(c => c.user_id === link.player_id)
          .map(c => ({ id: c.id, name: c.name, archetype: c.archetype, world: c.world, updatedAt: c.updated_at }))
        return {
          linkId:      link.id,
          id:          link.player_id,
          email:       profile.email,
          displayName: profile.display_name,
          characters
        }
      })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function generateInviteCode() {
    const auth = useAuthStore()
    const { data, error: err } = await supabase
      .from('gm_player_access')
      .insert({ gm_id: auth.user.id })
      .select('id, invite_code, created_at')
      .single()
    if (err) throw err
    pendingCodes.value.unshift({ id: data.id, code: data.invite_code, createdAt: data.created_at })
    return data.invite_code
  }

  async function revokeInvite(rowId) {
    const { error: err } = await supabase.from('gm_player_access').delete().eq('id', rowId)
    if (err) throw err
    pendingCodes.value = pendingCodes.value.filter(c => c.id !== rowId)
  }

  async function removePlayer(linkId) {
    const { error: err } = await supabase.from('gm_player_access').delete().eq('id', linkId)
    if (err) throw err
    players.value = players.value.filter(p => p.linkId !== linkId)
  }

  async function acceptInvite(inviteCode) {
    const auth = useAuthStore()

    const { data: invite, error: findErr } = await supabase
      .from('gm_player_access')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .eq('status', 'pending')
      .is('player_id', null)
      .single()

    if (findErr || !invite) throw new Error('Invalid or already-used invite code.')

    const { error: updateErr } = await supabase
      .from('gm_player_access')
      .update({ player_id: auth.user.id, status: 'accepted' })
      .eq('id', invite.id)

    if (updateErr) throw updateErr
  }

  return {
    players, pendingCodes, loading, error,
    fetchPlayers, generateInviteCode, revokeInvite, removePlayer, acceptInvite
  }
})
