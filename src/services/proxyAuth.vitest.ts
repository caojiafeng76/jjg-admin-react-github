import { beforeEach, describe, expect, it, vi } from 'vitest'

import supabase from './supabase'
import {
  buildAuthenticatedProxyHeaders,
  getAuthenticatedProxyHeaders,
} from './proxyAuth'

vi.mock('./supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

describe('buildAuthenticatedProxyHeaders', () => {
  it('attaches the current Supabase access token as a Bearer header', () => {
    expect(buildAuthenticatedProxyHeaders('current-access-token')).toEqual({
      Authorization: 'Bearer current-access-token',
      'Content-Type': 'application/json',
    })
  })

  it('rejects a missing Supabase access token', () => {
    expect(() => buildAuthenticatedProxyHeaders('  ')).toThrow(
      '登录状态已失效，请重新登录',
    )
  })
})

describe('getAuthenticatedProxyHeaders', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getSession).mockReset()
  })

  it('reads the current Supabase session token', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'session-access-token' } },
      error: null,
    } as never)

    await expect(getAuthenticatedProxyHeaders()).resolves.toMatchObject({
      Authorization: 'Bearer session-access-token',
    })
  })

  it('rejects when the current Supabase session is missing', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    await expect(getAuthenticatedProxyHeaders()).rejects.toThrow(
      '登录状态已失效，请重新登录',
    )
  })
})
