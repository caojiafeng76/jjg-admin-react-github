import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSupabaseAuthStorageKey,
  resolveSupabaseProxyUrl,
  validateSupabaseEnv,
} from './env'

const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co'
const SUPABASE_KEY = 'k'.repeat(64)

describe('Supabase 环境变量', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('未配置反代时直连 Supabase', () => {
    vi.stubEnv('VITE_REACT_APP_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('VITE_REACT_APP_SUPABASE_KEY', SUPABASE_KEY)
    vi.stubEnv('VITE_REACT_APP_SUPABASE_PROXY_URL', '')

    expect(validateSupabaseEnv()).toEqual({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      apiUrl: SUPABASE_URL,
      authStorageKey: 'sb-abcdefghijklmnop-auth-token',
    })
  })

  it('配置反代时请求走反代，登录态 key 仍按直连地址生成', () => {
    vi.stubEnv('VITE_REACT_APP_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('VITE_REACT_APP_SUPABASE_KEY', SUPABASE_KEY)
    vi.stubEnv(
      'VITE_REACT_APP_SUPABASE_PROXY_URL',
      ' https://supabase-proxy.example.com/ ',
    )

    const env = validateSupabaseEnv()

    expect(env.apiUrl).toBe('https://supabase-proxy.example.com')
    expect(env.authStorageKey).toBe('sb-abcdefghijklmnop-auth-token')
  })

  it('反代地址格式无效时报错', () => {
    expect(() => resolveSupabaseProxyUrl('not a url')).toThrow(
      'VITE_REACT_APP_SUPABASE_PROXY_URL 格式无效',
    )
    expect(resolveSupabaseProxyUrl(undefined)).toBeNull()
    expect(resolveSupabaseProxyUrl('   ')).toBeNull()
  })

  it('登录态 key 与 supabase-js 默认规则一致', () => {
    expect(getSupabaseAuthStorageKey('https://ref123.supabase.co')).toBe(
      'sb-ref123-auth-token',
    )
  })
})
