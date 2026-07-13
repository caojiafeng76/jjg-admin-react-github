import { Readable } from 'node:stream'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const serverMocks = vi.hoisted(() => ({
  fetchSyneyStoreReportFromServer: vi.fn(),
  fetchYoumaiPurchaseOrderFromServer: vi.fn(),
}))

vi.mock('../../syneyStoreReportServer', () => ({
  fetchSyneyStoreReportFromServer: serverMocks.fetchSyneyStoreReportFromServer,
}))
vi.mock('../../youmaiPurchaseOrderServer', () => ({
  fetchYoumaiPurchaseOrderFromServer:
    serverMocks.fetchYoumaiPurchaseOrderFromServer,
}))

import syneyHandler from '../../api/syney-store-report'
import youmaiHandler from '../../api/youmai-purchase-order'

type ResponseState = {
  body?: Record<string, unknown>
  status?: number
}

function createResponse(state: ResponseState) {
  return {
    setHeader: vi.fn(),
    status: vi.fn((status: number) => ({
      end: vi.fn(() => {
        state.status = status
      }),
      json: vi.fn((body: Record<string, unknown>) => {
        state.status = status
        state.body = body
      }),
    })),
  }
}

function createStreamRequest(
  rawBody: string | string[],
  parsedBody: Record<string, unknown>,
) {
  const chunks = (Array.isArray(rawBody) ? rawBody : [rawBody]).map((chunk) =>
    Buffer.from(chunk),
  )
  return Object.assign(Readable.from(chunks), {
    body: parsedBody,
    headers: {},
    method: 'POST',
  })
}

describe('authenticated proxy handlers', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    process.env.ALLOWED_ORIGIN = 'https://app.example.com'
    serverMocks.fetchSyneyStoreReportFromServer
      .mockReset()
      .mockResolvedValue([])
    serverMocks.fetchYoumaiPurchaseOrderFromServer
      .mockReset()
      .mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_PUBLISHABLE_KEY
    delete process.env.ALLOWED_ORIGIN
    vi.restoreAllMocks()
  })

  it.each([
    ['Syney', syneyHandler, { storeInNo: 'STORE-001' }],
    ['Youmai', youmaiHandler, { purchaseOrderNo: 'PO-001' }],
  ])(
    'returns 401 when the %s proxy has no access token',
    async (_, handler, body) => {
      const state: ResponseState = {}

      await handler(
        { body, headers: {}, method: 'POST' } as never,
        createResponse(state) as never,
      )

      expect(state.status).toBe(401)
    },
  )

  it('returns 403 when a verified Syney user lacks page permission', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(false), { status: 200 }),
        ),
    )
    const state: ResponseState = {}

    await syneyHandler(
      {
        body: { storeInNo: 'STORE-001' },
        headers: { authorization: 'Bearer access-token' },
        method: 'POST',
      } as never,
      createResponse(state) as never,
    )

    expect(state.status).toBe(403)
  })

  it('rejects Content-Length above 16 KiB before authentication', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchImpl)
    const state: ResponseState = {}

    await syneyHandler(
      {
        body: { storeInNo: 'STORE-001' },
        headers: { 'content-length': '16385' },
        method: 'POST',
      } as never,
      createResponse(state) as never,
    )

    expect(state.status).toBe(413)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it.each([
    ['Syney', syneyHandler, { storeInNo: 'STORE-001' }],
    ['Youmai', youmaiHandler, { purchaseOrderNo: 'PO-001' }],
  ])(
    'rejects the %s proxy raw body above 16 KiB even when parsed JSON is small',
    async (_, handler, body) => {
      const fetchImpl = vi.fn<typeof fetch>()
      vi.stubGlobal('fetch', fetchImpl)
      const state: ResponseState = {}
      const rawBody = `${' '.repeat(16 * 1024)}${JSON.stringify(body)}`
      const rawBodyChunks = [
        rawBody.slice(0, 8 * 1024),
        rawBody.slice(8 * 1024, 16 * 1024),
        rawBody.slice(16 * 1024),
      ]

      await handler(
        createStreamRequest(rawBodyChunks, body) as never,
        createResponse(state) as never,
      )

      expect(state.status).toBe(413)
      expect(fetchImpl).not.toHaveBeenCalled()
    },
  )

  it.each(['{', 'null', '[]'])(
    'returns 400 for invalid or non-object JSON body %s',
    async (body) => {
      const state: ResponseState = {}

      await syneyHandler(
        {
          body,
          headers: { authorization: 'Bearer access-token' },
          method: 'POST',
        } as never,
        createResponse(state) as never,
      )

      expect(state.status).toBe(400)
    },
  )

  it('returns a generic 502 without logging the upstream Error object', async () => {
    const upstreamError = new Error('sensitive upstream response')
    serverMocks.fetchSyneyStoreReportFromServer.mockRejectedValue(upstreamError)
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        String(input).includes('/auth/v1/user')
          ? new Response(JSON.stringify({ id: 'user-502' }), { status: 200 })
          : new Response(JSON.stringify(true), { status: 200 }),
      ),
    )
    const logSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const state: ResponseState = {}

    await syneyHandler(
      {
        body: { storeInNo: 'STORE-001' },
        headers: {
          authorization: 'Bearer access-token',
          'x-forwarded-for': '192.0.2.50',
        },
        method: 'POST',
      } as never,
      createResponse(state) as never,
    )

    expect(state).toEqual({
      body: { error: '西尼入库单代理服务暂不可用' },
      status: 502,
    })
    expect(logSpy.mock.calls.flat()).not.toContain(upstreamError)
  })

  it('returns 429 after 30 requests for the same user and IP', async () => {
    let limiterCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input)
        if (url.includes('/auth/v1/user')) {
          return new Response(JSON.stringify({ id: 'user-rate-limit' }), {
            status: 200,
          })
        }
        if (url.includes('/rpc/consume_proxy_rate_limit')) {
          limiterCalls += 1
          return new Response(JSON.stringify(limiterCalls <= 30), {
            status: 200,
          })
        }
        return new Response(JSON.stringify(true), { status: 200 })
      }),
    )

    let state: ResponseState = {}
    for (let attempt = 0; attempt < 31; attempt += 1) {
      state = {}
      await syneyHandler(
        {
          body: { storeInNo: 'STORE-001' },
          headers: {
            authorization: 'Bearer access-token',
            'x-forwarded-for': '192.0.2.60',
          },
          method: 'POST',
        } as never,
        createResponse(state) as never,
      )
    }

    expect(state.status).toBe(429)
  })

  it('handles allowed CORS preflight and rejects unsupported methods', async () => {
    const preflightState: ResponseState = {}
    const preflightResponse = createResponse(preflightState)

    await syneyHandler(
      {
        headers: { origin: 'https://app.example.com' },
        method: 'OPTIONS',
      } as never,
      preflightResponse as never,
    )

    expect(preflightState.status).toBe(204)
    expect(preflightResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://app.example.com',
    )

    const methodState: ResponseState = {}
    await syneyHandler(
      { headers: {}, method: 'GET' } as never,
      createResponse(methodState) as never,
    )
    expect(methodState.status).toBe(405)
  })
})
