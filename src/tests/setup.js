import { vi } from 'vitest'

// Mock Supabase so tests never hit the network
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}))
