import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createSyneyDeliveryOrderHandler,
  isSameOriginRequest,
} from '../../server/syneyDeliveryOrderHttp'
import { resolveDevProxyEnv } from '../../server/viteSyneyDeliveryOrderProxy'

function createResponse() {
  const headers: Record<string, string> = {}
  const response = {
    statusCode: 200,
    body: '',
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value
    },
    end: (chunk?: string) => {
      response.body = chunk ?? ''
    },
  }
  return { response, headers }
}

function createRequest(headers: Record<string, string>, method = 'GET') {
  return { method, headers, socket: {} } as unknown as IncomingMessage
}

describe('isSameOriginRequest', () => {
  it('compares the Origin host with the request Host', () => {
    expect(isSameOriginRequest('https://localhost:5173', 'localhost:5173')).toBe(true)
    expect(isSameOriginRequest('https://192.168.1.5:5173', '192.168.1.5:5173')).toBe(true)
    expect(isSameOriginRequest('https://evil.example.com', 'localhost:5173')).toBe(false)
    expect(isSameOriginRequest('not a url', 'localhost:5173')).toBe(false)
    expect(isSameOriginRequest(undefined, 'localhost:5173')).toBe(false)
  })
})

describe('createSyneyDeliveryOrderHandler origin check', () => {
  const env = { ALLOWED_ORIGIN: '' }

  it('rejects cross-origin requests without ALLOWED_ORIGIN', async () => {
    const { response } = createResponse()
    await createSyneyDeliveryOrderHandler(env)(
      createRequest({ origin: 'https://localhost:5173', host: 'localhost:5173' }),
      response as unknown as ServerResponse,
    )
    expect(response.statusCode).toBe(403)
    expect(response.body).toContain('Origin not allowed')
  })

  it('lets same-origin dev requests through when allowSameOrigin is on', async () => {
    const { response } = createResponse()
    await createSyneyDeliveryOrderHandler(env, { allowSameOrigin: true })(
      createRequest({ origin: 'https://localhost:5173', host: 'localhost:5173' }),
      response as unknown as ServerResponse,
    )
    // 通过了来源校验，止步于方法校验（GET）
    expect(response.statusCode).toBe(405)
  })

  it('reads the host from :authority for HTTP/2 requests (Vite over HTTPS)', async () => {
    const { response } = createResponse()
    await createSyneyDeliveryOrderHandler(env, { allowSameOrigin: true })(
      createRequest({ 'origin': 'https://localhost:5173', ':authority': 'localhost:5173' }),
      response as unknown as ServerResponse,
    )
    expect(response.statusCode).toBe(405)
  })

  it('still rejects other origins when allowSameOrigin is on', async () => {
    const { response } = createResponse()
    await createSyneyDeliveryOrderHandler(env, { allowSameOrigin: true })(
      createRequest({ origin: 'https://evil.example.com', host: 'localhost:5173' }),
      response as unknown as ServerResponse,
    )
    expect(response.statusCode).toBe(403)
  })
})

describe('resolveDevProxyEnv', () => {
  it('falls back to the frontend Supabase proxy URL and public key', () => {
    expect(
      resolveDevProxyEnv({
        VITE_REACT_APP_SUPABASE_URL: 'https://project.supabase.co',
        VITE_REACT_APP_SUPABASE_PROXY_URL: 'https://proxy.example.com',
        VITE_REACT_APP_SUPABASE_KEY: 'public-key',
      }),
    ).toMatchObject({
      SUPABASE_URL: 'https://proxy.example.com',
      SUPABASE_PUBLISHABLE_KEY: 'public-key',
    })
    expect(
      resolveDevProxyEnv({
        VITE_REACT_APP_SUPABASE_URL: 'https://project.supabase.co',
        VITE_REACT_APP_SUPABASE_KEY: 'public-key',
      }).SUPABASE_URL,
    ).toBe('https://project.supabase.co')
  })

  it('keeps explicitly configured server values', () => {
    expect(
      resolveDevProxyEnv({
        SUPABASE_URL: 'https://server.example.com',
        SUPABASE_PUBLISHABLE_KEY: 'server-key',
        VITE_REACT_APP_SUPABASE_URL: 'https://project.supabase.co',
        VITE_REACT_APP_SUPABASE_KEY: 'public-key',
      }),
    ).toMatchObject({
      SUPABASE_URL: 'https://server.example.com',
      SUPABASE_PUBLISHABLE_KEY: 'server-key',
    })
  })
})

describe('createSyneyDeliveryOrderHandler permissions', () => {
  const env = {
    ALLOWED_ORIGIN: 'https://app.example.com',
    SUPABASE_URL: 'https://supabase.example.com',
    SUPABASE_PUBLISHABLE_KEY: 'public-key',
  }

  /** 模拟 Supabase：用户已登录，只有 grantedPermissions 中的权限；限流返回 false 以便止步于 429 */
  function stubSupabase(grantedPermissions: string[]) {
    const checked: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/v1/user'))
        return Response.json({ id: 'user-1' })
      if (url.endsWith('/rpc/current_user_has_permission')) {
        const { p_key } = JSON.parse(String(init?.body)) as { p_key: string }
        checked.push(p_key)
        return Response.json(grantedPermissions.includes(p_key))
      }
      if (url.endsWith('/rpc/consume_proxy_rate_limit'))
        return Response.json(false)
      throw new Error(`unexpected fetch ${url}`)
    }))
    return checked
  }

  async function post(body: unknown) {
    const json = JSON.stringify(body)
    const request = Object.assign(Readable.from([json]), {
      method: 'POST',
      headers: {
        'origin': 'https://app.example.com',
        'authorization': 'Bearer token',
        'content-length': String(Buffer.byteLength(json)),
      },
      socket: {},
    }) as unknown as IncomingMessage
    const { response } = createResponse()
    await createSyneyDeliveryOrderHandler(env)(request, response as unknown as ServerResponse)
    return response
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lets checkSafeParts through with only the export permission', async () => {
    const checked = stubSupabase(['feature:syney-po-list.export'])
    const response = await post({ action: 'checkSafeParts', payload: { poNos: ['P1'] } })
    // 通过了权限校验，止步于限流
    expect(response.statusCode).toBe(429)
    expect(checked).toEqual(['feature:syney-po-list.export'])
  })

  it('falls back to the delivery-order permission for checkSafeParts', async () => {
    const checked = stubSupabase(['feature:syney-po-list.delivery-order'])
    const response = await post({ action: 'checkSafeParts', payload: { poNos: ['P1'] } })
    expect(response.statusCode).toBe(429)
    expect(checked).toEqual([
      'feature:syney-po-list.export',
      'feature:syney-po-list.delivery-order',
    ])
  })

  it('rejects create with only the export permission', async () => {
    const checked = stubSupabase(['feature:syney-po-list.export'])
    const response = await post({ action: 'create', payload: { poNo: 'P1' } })
    expect(response.statusCode).toBe(403)
    expect(checked).toEqual(['feature:syney-po-list.delivery-order'])
  })
})
