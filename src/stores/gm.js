import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './auth.js'

export const useGmStore = defineStore('gm', () => {
  // campaigns: [{ id, name, createdAt, pendingCodes: [], players: [] }]
  // player: { memberId, id, email, displayName, characters: [] }
  const campaigns = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  async function fetchCampaigns() {
    loading.value = true
    error.value   = null
    try {
      const auth = useAuthStore()

      // Load all campaigns for this GM
      const { data: camps, error: campsErr } = await supabase
        .from('campaigns')
        .select('id, name, created_at')
        .eq('gm_id', auth.user.id)
        .order('created_at', { ascending: true })
      if (campsErr) throw campsErr

      if (camps.length === 0) { campaigns.value = []; return }

      // Load all member rows for those campaigns
      const campIds = camps.map(c => c.id)
      const { data: members, error: membersErr } = await supabase
        .from('campaign_members')
        .select('id, campaign_id, player_id, invite_code, status, created_at')
        .in('campaign_id', campIds)
        .order('created_at', { ascending: false })
      if (membersErr) throw membersErr

      const acceptedPlayerIds = [...new Set(
        members.filter(m => m.status === 'accepted' && m.player_id).map(m => m.player_id)
      )]

      // Load profiles + characters for accepted players
      let profileMap = {}
      let charsByPlayer = {}

      if (acceptedPlayerIds.length > 0) {
        const [profilesResult, charsResult] = await Promise.all([
          supabase.from('profiles').select('id, display_name, email').in('id', acceptedPlayerIds),
          supabase
            .from('characters')
            .select('id, name, archetype, world, user_id, updated_at')
            .in('user_id', acceptedPlayerIds)
            .order('updated_at', { ascending: false })
        ])
        if (profilesResult.error) throw profilesResult.error
        if (charsResult.error)    throw charsResult.error

        profileMap    = Object.fromEntries(profilesResult.data.map(p => [p.id, p]))
        charsByPlayer = charsResult.data.reduce((acc, c) => {
          ;(acc[c.user_id] ||= []).push({ id: c.id, name: c.name, archetype: c.archetype, world: c.world, updatedAt: c.updated_at })
          return acc
        }, {})
      }

      // Assemble campaign objects
      campaigns.value = camps.map(camp => {
        const campMembers = members.filter(m => m.campaign_id === camp.id)
        const pending = campMembers
          .filter(m => m.status === 'pending')
          .map(m => ({ id: m.id, code: m.invite_code, createdAt: m.created_at }))

        const players = campMembers
          .filter(m => m.status === 'accepted' && m.player_id)
          .map(m => {
            const profile = profileMap[m.player_id] || {}
            return {
              memberId:    m.id,
              id:          m.player_id,
              email:       profile.email,
              displayName: profile.display_name,
              characters:  charsByPlayer[m.player_id] || []
            }
          })

        return { id: camp.id, name: camp.name, createdAt: camp.created_at, pendingCodes: pending, players }
      })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createCampaign(name) {
    const auth = useAuthStore()
    const { data, error: err } = await supabase
      .from('campaigns')
      .insert({ gm_id: auth.user.id, name: name.trim() || 'Unnamed Campaign' })
      .select('id, name, created_at')
      .single()
    if (err) throw err
    campaigns.value.push({ id: data.id, name: data.name, createdAt: data.created_at, pendingCodes: [], players: [] })
    return data
  }

  async function renameCampaign(campaignId, name) {
    const { error: err } = await supabase
      .from('campaigns')
      .update({ name: name.trim() || 'Unnamed Campaign' })
      .eq('id', campaignId)
    if (err) throw err
    const camp = campaigns.value.find(c => c.id === campaignId)
    if (camp) camp.name = name.trim() || 'Unnamed Campaign'
  }

  async function deleteCampaign(campaignId) {
    const { error: err } = await supabase.from('campaigns').delete().eq('id', campaignId)
    if (err) throw err
    campaigns.value = campaigns.value.filter(c => c.id !== campaignId)
  }

  async function generateInviteCode(campaignId) {
    const { data, error: err } = await supabase
      .from('campaign_members')
      .insert({ campaign_id: campaignId })
      .select('id, invite_code, created_at')
      .single()
    if (err) throw err
    const camp = campaigns.value.find(c => c.id === campaignId)
    if (camp) camp.pendingCodes.unshift({ id: data.id, code: data.invite_code, createdAt: data.created_at })
    return data.invite_code
  }

  async function revokeInvite(memberId) {
    const { error: err } = await supabase.from('campaign_members').delete().eq('id', memberId)
    if (err) throw err
    for (const camp of campaigns.value) {
      camp.pendingCodes = camp.pendingCodes.filter(c => c.id !== memberId)
    }
  }

  async function removePlayer(memberId) {
    const { error: err } = await supabase.from('campaign_members').delete().eq('id', memberId)
    if (err) throw err
    for (const camp of campaigns.value) {
      camp.players = camp.players.filter(p => p.memberId !== memberId)
    }
  }

  // Called by the player to accept an invite code.
  // Returns { campaignName, gmEmail } so the UI can confirm what they joined.
  async function acceptInvite(inviteCode) {
    const auth = useAuthStore()

    const { data: member, error: findErr } = await supabase
      .from('campaign_members')
      .select('id, campaign_id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .eq('status', 'pending')
      .is('player_id', null)
      .single()

    if (findErr || !member) throw new Error('Invalid or already-used invite code.')

    const { error: updateErr } = await supabase
      .from('campaign_members')
      .update({ player_id: auth.user.id, status: 'accepted' })
      .eq('id', member.id)
    if (updateErr) throw updateErr

    // Fetch campaign name for confirmation message
    const { data: camp } = await supabase
      .from('campaigns')
      .select('name, gm_id')
      .eq('id', member.campaign_id)
      .single()

    let gmEmail = null
    if (camp?.gm_id) {
      const { data: gmProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', camp.gm_id)
        .single()
      gmEmail = gmProfile?.email
    }

    return { campaignName: camp?.name ?? 'Unknown Campaign', gmEmail }
  }

  return {
    campaigns, loading, error,
    fetchCampaigns, createCampaign, renameCampaign, deleteCampaign,
    generateInviteCode, revokeInvite, removePlayer, acceptInvite
  }
})
