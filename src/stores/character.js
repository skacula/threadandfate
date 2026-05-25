import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultCharacter } from '../character.js'

export const useCharacterStore = defineStore('characters', () => {
  const list = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const saved = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const r = await fetch('/api/characters')
      list.value = await r.json()
    } catch (e) { error.value = e.message }
    finally { loading.value = false }
  }

  async function fetchOne(id) {
    loading.value = true
    try {
      const r = await fetch(`/api/characters/${id}`)
      if (!r.ok) throw new Error('Not found')
      current.value = await r.json()
    } catch (e) { error.value = e.message }
    finally { loading.value = false }
  }

  async function create(data) {
    const r = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!r.ok) throw new Error('Create failed')
    const char = await r.json()
    list.value.push({ id: char.id, name: char.name, archetype: char.archetype, world: char.world })
    return char
  }

  async function save(id, data, silent = false) {
    const r = await fetch(`/api/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!r.ok) throw new Error('Save failed')
    if (!silent) {
      current.value = await r.json()
      saved.value = true
      setTimeout(() => { saved.value = false }, 2000)
      return current.value
    }
  }

  async function remove(id) {
    await fetch(`/api/characters/${id}`, { method: 'DELETE' })
    list.value = list.value.filter(c => c.id !== id)
    if (current.value?.id === id) current.value = null
  }

  function newCharacter() {
    current.value = defaultCharacter()
  }

  return { list, current, loading, error, saved,
           fetchList, fetchOne, create, save, remove, newCharacter }
})
