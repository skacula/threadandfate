import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

// ─── Minimal stubs for stores and router ────────────────────────────────────

vi.mock('../stores/auth.js', () => ({
  useAuthStore: () => ({ isGM: false, user: { id: 'u1' } }),
}))

const mockAssignToCampaign = vi.fn()
const mockRemove           = vi.fn()
let mockList               = []
let mockLoading            = false

vi.mock('../stores/character.js', () => ({
  useCharacterStore: () => ({
    get list()    { return mockList },
    get loading() { return mockLoading },
    fetchList:        vi.fn(),
    remove:           mockRemove,
    assignToCampaign: mockAssignToCampaign,
  }),
}))

let mockPlayerCampaigns = []

const mockAcceptInvite         = vi.fn()
const mockFetchPlayerCampaigns = vi.fn()

vi.mock('../stores/gm.js', () => ({
  useGmStore: () => ({
    get playerCampaigns() { return mockPlayerCampaigns },
    fetchPlayerCampaigns: mockFetchPlayerCampaigns,
    acceptInvite:         mockAcceptInvite,
  }),
}))

// ─── Router stub ─────────────────────────────────────────────────────────────

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

// ─── Helper ──────────────────────────────────────────────────────────────────

async function mountHome() {
  const { default: Home } = await import('../views/Home.vue')
  const wrapper = mount(Home, {
    global: { plugins: [createPinia(), router] },
  })
  await router.isReady()
  return wrapper
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Home.vue — campaign display', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockList             = []
    mockLoading          = false
    mockPlayerCampaigns  = []
    mockAssignToCampaign.mockReset()
    mockFetchPlayerCampaigns.mockReset()
    mockAcceptInvite.mockReset()
  })

  it('shows campaign select when player has joined campaigns', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: 'camp-1', campaignName: 'The Dark Pact', updatedAt: null },
    ]
    mockPlayerCampaigns = [{ id: 'camp-1', name: 'The Dark Pact' }]

    const w = await mountHome()
    expect(w.find('.char-camp-select').exists()).toBe(true)
    expect(w.find('.char-camp-select').find('option[value="camp-1"]').exists()).toBe(true)
  })

  it('shows static campaign badge when player has no joined campaigns but character has one', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: 'camp-1', campaignName: 'The Dark Pact', updatedAt: null },
    ]
    mockPlayerCampaigns = []

    const w = await mountHome()
    expect(w.find('.char-camp-select').exists()).toBe(false)
    expect(w.find('.char-camp-badge').text()).toBe('The Dark Pact')
  })

  it('shows "No active campaigns" when player has no campaigns and character has none', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: null, campaignName: null, updatedAt: null },
    ]
    mockPlayerCampaigns = []

    const w = await mountHome()
    expect(w.find('.char-camp-none').text()).toBe('No active campaigns')
  })

  it('calls assignToCampaign with the selected campaign id and name on select change', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: null, campaignName: null, updatedAt: null },
    ]
    mockPlayerCampaigns = [{ id: 'camp-1', name: 'The Dark Pact' }]
    mockAssignToCampaign.mockResolvedValue()

    const w = await mountHome()
    const select = w.find('.char-camp-select')
    await select.setValue('camp-1')
    await select.trigger('change')

    expect(mockAssignToCampaign).toHaveBeenCalledWith('c1', 'camp-1', 'The Dark Pact')
  })

  it('calls assignToCampaign with empty string to unassign', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: 'camp-1', campaignName: 'The Dark Pact', updatedAt: null },
    ]
    mockPlayerCampaigns = [{ id: 'camp-1', name: 'The Dark Pact' }]
    mockAssignToCampaign.mockResolvedValue()

    const w = await mountHome()
    const select = w.find('.char-camp-select')
    await select.setValue('')
    await select.trigger('change')

    expect(mockAssignToCampaign).toHaveBeenCalledWith('c1', '', undefined)
  })

  it('clicking the campaign select does not navigate to the character page', async () => {
    mockList = [
      { id: 'c1', name: 'Aria', archetype: 'Rogue', world: 'Midgard',
        campaignId: null, campaignName: null, updatedAt: null },
    ]
    mockPlayerCampaigns = [{ id: 'camp-1', name: 'The Dark Pact' }]

    const w = await mountHome()
    // click.stop is applied on the campaign row; clicking it should not trigger card navigation
    await w.find('.char-campaign').trigger('click')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('refreshes playerCampaigns after successfully accepting an invite', async () => {
    mockList = []
    mockPlayerCampaigns = []
    mockAcceptInvite.mockResolvedValue({ campaignName: 'New Campaign', gmEmail: 'gm@test.com' })
    mockFetchPlayerCampaigns.mockResolvedValue()

    const w = await mountHome()
    await w.find('input').setValue('ABC12345')
    await w.find('form').trigger('submit')
    await vi.dynamicImportSettled?.()

    expect(mockFetchPlayerCampaigns).toHaveBeenCalled()
  })
})
