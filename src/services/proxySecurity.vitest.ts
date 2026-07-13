import { describe, expect, it, vi } from 'vitest'

import {
  authorizeProxyRequest,
  consumeDistributedProxyRateLimit,
  isJsonBodyWithinLimit,
  parseProxyIdentifier,
  resolveAllowedOrigin,
  safeErrorMetadata,
  validateContentLength,
} from '../../api/proxySecurity'

const SUPABASE_URL = 'https://project.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'publishable-key'

describe('authorizeProxyRequest', () => {
  it('returns 401 without a Bearer token', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    await expect(
      authorizeProxyRequest({
        authorization: undefined,
        fetchImpl,
        permission: 'page:syney-store-report-list',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      }),
    ).resolves.toEqual({ ok: false, status: 401 })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 403 when the verified user lacks the requested permission', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(false), { status: 200 }),
      )

    await expect(
      authorizeProxyRequest({
        authorization: 'Bearer access-token',
        fetchImpl,
        permission: 'page:syney-store-report-list',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      }),
    ).resolves.toEqual({ ok: false, status: 403 })
  })

  it('allows diagnostics only for a verified active admin employee', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(true), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ role: 'admin', is_active: true }]), {
          status: 200,
        }),
      )

    await expect(
      authorizeProxyRequest({
        authorization: 'Bearer access-token',
        diagnose: true,
        fetchImpl,
        permission: 'page:syney-store-report-list',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      } as Parameters<typeof authorizeProxyRequest>[0]),
    ).resolves.toEqual({ ok: true, userId: 'user-1' })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(String(fetchImpl.mock.calls[2]?.[0])).toContain(
      '/rest/v1/employees?',
    )
  })

  it('denies diagnostics to a non-admin employee', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'user-2' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(true), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ role: 'viewer', is_active: true }]), {
          status: 200,
        }),
      )

    await expect(
      authorizeProxyRequest({
        authorization: 'Bearer access-token',
        diagnose: true,
        fetchImpl,
        permission: 'page:syney-store-report-list',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      } as Parameters<typeof authorizeProxyRequest>[0]),
    ).resolves.toEqual({ ok: false, status: 403 })
  })
})

describe('proxy input security decisions', () => {
  it('limits serialized JSON bodies to 16 KiB', () => {
    expect(isJsonBodyWithinLimit({ value: 'a'.repeat(16 * 1024) })).toBe(false)
    expect(isJsonBodyWithinLimit({ value: 'ok' })).toBe(true)
  })

  it('validates the declared Content-Length before parsed body inspection', () => {
    expect(validateContentLength(undefined)).toBe('ok')
    expect(validateContentLength('16384')).toBe('ok')
    expect(validateContentLength('16385')).toBe('too-large')
    expect(validateContentLength('invalid')).toBe('invalid')
  })

  it('redacts error messages and bodies from log metadata', () => {
    const error = Object.assign(new Error('sensitive upstream response'), {
      body: 'sensitive body',
      status: 503,
    })

    expect(safeErrorMetadata(error)).toEqual({ name: 'Error', status: 503 })
  })

  it('trims identifiers and enforces a 1..64 character length', () => {
    expect(parseProxyIdentifier('  PO-001  ')).toBe('PO-001')
    expect(parseProxyIdentifier('')).toBeNull()
    expect(parseProxyIdentifier('a'.repeat(65))).toBeNull()
  })

  it('never defaults CORS to a wildcard origin', () => {
    expect(
      resolveAllowedOrigin('https://app.example.com', undefined),
    ).toBeNull()
    expect(resolveAllowedOrigin('https://app.example.com', '*')).toBeNull()
    expect(
      resolveAllowedOrigin(
        'https://app.example.com',
        'https://app.example.com,https://admin.example.com',
      ),
    ).toBe('https://app.example.com')
  })

  it('uses the authenticated Supabase RPC for distributed rate limiting', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(true), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    await expect(
      consumeDistributedProxyRateLimit({
        authorization: 'Bearer access-token',
        fetchImpl,
        ip: '192.0.2.1',
        scope: 'syney-store-report',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      }),
    ).resolves.toBe(true)

    expect(fetchImpl).toHaveBeenCalledWith(
      `${SUPABASE_URL}/rest/v1/rpc/consume_proxy_rate_limit`,
      expect.objectContaining({
        body: JSON.stringify({
          p_ip: '192.0.2.1',
          p_scope: 'syney-store-report',
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          apikey: SUPABASE_PUBLISHABLE_KEY,
        }),
        method: 'POST',
      }),
    )
  })

  it('fails closed when the distributed limiter rejects or cannot respond', async () => {
    const rejectedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(false), { status: 200 }))

    await expect(
      consumeDistributedProxyRateLimit({
        authorization: 'Bearer access-token',
        fetchImpl: rejectedFetch,
        ip: '192.0.2.1',
        scope: 'syney-store-report',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      }),
    ).resolves.toBe(false)

    await expect(
      consumeDistributedProxyRateLimit({
        authorization: 'Bearer access-token',
        fetchImpl: vi
          .fn<typeof fetch>()
          .mockResolvedValue(new Response(null, { status: 503 })),
        ip: '192.0.2.1',
        scope: 'syney-store-report',
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: SUPABASE_URL,
      }),
    ).rejects.toThrow('Supabase rate limit check failed')
  })
})
