import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './auth.js'
import { defaultCharacter } from '../character.js'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'character'
}

function makeId(name) {
  return `${slugify(name)}-${Date.now().toString(36)}`
}

export const useCharacterStore = defineStore('characters', () => {
  const list             = ref([])
  const current          = ref(null)
  const shareToken       = ref(null)
  const characterOwnerId = ref(null)  // user_id of the character being viewed
  const loading          = ref(false)
  const error            = ref(null)
  const saved            = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const auth = useAuthStore()
      const { data, error: err } = await supabase
        .from('characters')
        .select('id, name, archetype, world, updated_at')
        .eq('user_id', auth.user.id)
        .order('updated_at', { ascending: false })
      if (err) throw err
      list.value = data.map(r => ({
        id: r.id, name: r.name, archetype: r.archetype,
        world: r.world, updatedAt: r.updated_at
      }))
    } catch (e) { error.value = e.message }
    finally { loading.value = false }
  }

  async function fetchOne(id) {
    loading.value = true
    error.value   = null
    current.value = null
    try {
      const { data, error: err } = await supabase
        .from('characters')
        .select('data, share_token, user_id')
        .eq('id', id)
        .single()
      if (err) throw err
      if (!data?.data) throw new Error('Character data is empty or missing.')
      current.value          = data.data
      shareToken.value       = data.share_token
      characterOwnerId.value = data.user_id
    } catch (e) { error.value = e.message }
    finally { loading.value = false }
  }

  async function create(formData) {
    const auth = useAuthStore()
    const id   = makeId(formData.name || 'character')
    const now  = new Date().toISOString()
    const character = { ...formData, id, meta: { createdAt: now, updatedAt: now } }

    const { error: err } = await supabase.from('characters').insert({
      id,
      name:        character.name || '',
      archetype:   character.archetype || '',
      world:       character.world || '',
      player_name: character.playerName || '',
      user_id:     auth.user.id,
      data:        character
    })
    if (err) throw err

    list.value.unshift({ id, name: character.name, archetype: character.archetype, world: character.world })
    return character
  }

  async function save(id, data, silent = false) {
    const now       = new Date().toISOString()
    const createdAt = current.value?.meta?.createdAt || now
    const character = { ...data, id, meta: { createdAt, updatedAt: now } }

    const auth    = useAuthStore()
    const isOwner = characterOwnerId.value === auth.user?.id

    let err
    if (isOwner) {
      // Owner path: upsert with full ownership fields
      const result = await supabase.from('characters').upsert({
        id,
        name:        character.name || '',
        archetype:   character.archetype || '',
        world:       character.world || '',
        player_name: character.playerName || '',
        user_id:     auth.user.id,
        data:        character
      })
      err = result.error
    } else {
      // GM path: UPDATE only — never reassign user_id
      const result = await supabase.from('characters').update({
        name:        character.name || '',
        archetype:   character.archetype || '',
        world:       character.world || '',
        player_name: character.playerName || '',
        data:        character
      }).eq('id', id)
      err = result.error
    }

    if (err) throw err

    if (!silent) {
      current.value = character
      saved.value   = true
      setTimeout(() => { saved.value = false }, 2000)
    }
    return character
  }

  async function remove(id) {
    await supabase.from('characters').delete().eq('id', id)
    list.value = list.value.filter(c => c.id !== id)
    if (current.value?.id === id) current.value = null
  }

  async function generateShareToken(id) {
    const token = crypto.randomUUID()
    const { error: err } = await supabase
      .from('characters')
      .update({ share_token: token })
      .eq('id', id)
    if (err) throw err
    shareToken.value = token
    return token
  }

  async function revokeShareToken(id) {
    const { error: err } = await supabase
      .from('characters')
      .update({ share_token: null })
      .eq('id', id)
    if (err) throw err
    shareToken.value = null
  }

  function newCharacter() {
    current.value          = defaultCharacter()
    shareToken.value       = null
    characterOwnerId.value = null
  }

  return {
    list, current, shareToken, characterOwnerId, loading, error, saved,
    fetchList, fetchOne, create, save, remove,
    generateShareToken, revokeShareToken, newCharacter
  }
})
