import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { supabase } from '../lib/supabase.js'

// Helper to build a chainable Supabase query mock
function mockQuery(resolveWith) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveWith),
  }
  // Make the chain itself thenable so awaiting the final call resolves
  chain.then = (resolve) => resolve(resolveWith)
  return chain
}

// ─── character store ─────────────────────────────────────────────────────────

describe('useCharacterStore', () => {
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())

    // Lazy-import after pinia is active
    const mod = await import('../stores/character.js')
    store = mod.useCharacterStore()

    vi.mocked(supabase.from).mockReset()
  })

  describe('fetchList', () => {
    it('maps campaign fields when a character belongs to a campaign', async () => {
      const rows = [
        {
          id: 'char-1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
          updated_at: '2026-01-01T00:00:00Z',
          campaign_id: 'camp-abc',
          campaigns: { name: 'The Dark Pact' },
        },
      ]

      vi.mocked(supabase.from).mockReturnValue(mockQuery({ data: rows, error: null }))

      // stub auth store
      const { useAuthStore } = await import('../stores/auth.js')
      vi.spyOn(useAuthStore(), 'user', 'get').mockReturnValue({ id: 'user-1' })

      await store.fetchList()

      expect(store.list[0].campaignId).toBe('camp-abc')
      expect(store.list[0].campaignName).toBe('The Dark Pact')
    })

    it('sets campaignId and campaignName to null when character has no campaign', async () => {
      const rows = [
        {
          id: 'char-2', name: 'Bram', archetype: 'Warrior', world: 'Terra',
          updated_at: '2026-01-02T00:00:00Z',
          campaign_id: null,
          campaigns: null,
        },
      ]

      vi.mocked(supabase.from).mockReturnValue(mockQuery({ data: rows, error: null }))

      const { useAuthStore } = await import('../stores/auth.js')
      vi.spyOn(useAuthStore(), 'user', 'get').mockReturnValue({ id: 'user-1' })

      await store.fetchList()

      expect(store.list[0].campaignId).toBeNull()
      expect(store.list[0].campaignName).toBeNull()
    })

    it('sets error state when supabase returns an error', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        mockQuery({ data: null, error: { message: 'DB failure' } })
      )

      const { useAuthStore } = await import('../stores/auth.js')
      vi.spyOn(useAuthStore(), 'user', 'get').mockReturnValue({ id: 'user-1' })

      await store.fetchList()

      expect(store.error).toBe('DB failure')
      expect(store.list).toHaveLength(0)
    })
  })

  describe('assignToCampaign', () => {
    it('updates campaignId and campaignName on the list item after assignment', async () => {
      // Pre-populate list
      store.list.push({ id: 'char-1', campaignId: null, campaignName: null })

      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(chain)

      await store.assignToCampaign('char-1', 'camp-abc', 'The Dark Pact')

      expect(store.list[0].campaignId).toBe('camp-abc')
      expect(store.list[0].campaignName).toBe('The Dark Pact')
    })

    it('clears campaign when called with empty string (unassign)', async () => {
      store.list.push({ id: 'char-1', campaignId: 'camp-abc', campaignName: 'The Dark Pact' })

      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(chain)

      await store.assignToCampaign('char-1', '', undefined)

      expect(store.list[0].campaignId).toBeNull()
      expect(store.list[0].campaignName).toBeNull()
    })

    it('throws when supabase returns an error', async () => {
      store.list.push({ id: 'char-1', campaignId: null, campaignName: null })

      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Permission denied' } }),
      }
      vi.mocked(supabase.from).mockReturnValue(chain)

      await expect(store.assignToCampaign('char-1', 'camp-xyz', 'Bad Camp'))
        .rejects.toThrow('Permission denied')
    })
  })
})
