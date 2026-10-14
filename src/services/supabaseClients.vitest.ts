import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createClient = vi.fn((..._args: unknown[]) => ({}))

vi.mock('@supabase/supabase-js', () => ({ createClient }))

describe('Supabase 客户端重试配置', () => {
  beforeEach(() => {
    vi.resetModules()
    createClient.mockClear()
    vi.stubEnv(
      'VITE_REACT_APP_SUPABASE_URL',
      'https://abcdefghijklmnop.supabase.co',
    )
    vi.stubEnv('VITE_REACT_APP_SUPABASE_KEY', 'k'.repeat(64))
    vi.stubEnv('VITE_REACT_APP_SUPABASE_PROXY_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([['./supabase'], ['./publicSupabase']])(
    '%s 关闭 postgrest-js 内置重试，网络重试只由 createRetryingFetch 负责',
    async (modulePath) => {
      await import(modulePath)

      expect(createClient).toHaveBeenCalledTimes(1)
      const options = createClient.mock.calls[0][2] as {
        db?: { retry?: boolean }
        global?: { fetch?: unknown }
      }
      expect(options.db?.retry).toBe(false)
      expect(typeof options.global?.fetch).toBe('function')
    },
  )
})
