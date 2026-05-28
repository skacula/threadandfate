import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { supabase } from '../lib/supabase.js'

describe('useGmStore — fetchPlayerCampaigns', () => {
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.mocked(supabase.from).mockReset()

    const mod = await import('../stores/gm.js')
    store = mod.useGmStore()
  })

  it('populates playerCampaigns with campaigns returned by supabase', async () => {
    const camps = [
      { id: 'camp-1', name: 'The Dark Pact' },
      { id: 'camp-2', name: 'Shattered Realm' },
    ]

    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: camps, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain)

    await store.fetchPlayerCampaigns()

    expect(store.playerCampaigns).toEqual(camps)
  })

  it('sets playerCampaigns to empty array when player has no campaigns', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain)

    await store.fetchPlayerCampaigns()

    expect(store.playerCampaigns).toEqual([])
  })

  it('throws when supabase returns an error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain)

    await expect(store.fetchPlayerCampaigns()).rejects.toThrow('Network error')
  })
})
