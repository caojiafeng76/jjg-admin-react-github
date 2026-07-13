import { PassThrough } from 'node:stream'

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

import { syneyStoreReportProxy } from '../../viteSyneyStoreReportProxy'
import { youmaiPurchaseOrderProxy } from '../../viteYoumaiPurchaseOrderProxy'

type Middleware = (
  request: PassThrough,
  response: TestResponse,
) => Promise<void>

type TestResponse = {
  body?: Record<string, unknown>
  end: (body?: string) => void
  headers: Map<string, string>
  setHeader: (name: string, value: string) => void
  statusCode: number
}

const env = {
  ALLOWED_ORIGIN: 'https://app.example.com',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_URL: 'https://project.supabase.co',
}

function getMiddleware(
  plugin: ReturnType<
    typeof syneyStoreReportProxy | typeof youmaiPurchaseOrderProxy
  >,
): Middleware {
  let middleware: Middleware | undefined
  const server = {
    middlewares: {
      use: vi.fn((_path: string, handler: Middleware) => {
        middleware = handler
      }),
    },
  }
  ;(plugin.configureServer as (server: unknown) => void)(server)
  if (!middleware) throw new Error('Middleware was not registered')
  return middleware
}

function createRequest(
  body: string,
  headers: Record<string, string> = {},
  method = 'POST',
): PassThrough {
  const request = new PassThrough()
  Object.assign(request, {
    headers,
    method,
    socket: { remoteAddress: '127.0.0.1' },
  })
  request.end(Buffer.from(body))
  return request
}

function createResponse(): TestResponse {
  const response: TestResponse = {
    end(body) {
      response.body = body
        ? (JSON.parse(body) as Record<string, unknown>)
        : undefined
    },
    headers: new Map(),
    setHeader(name, value) {
      response.headers.set(name.toLowerCase(), value)
    },
    statusCode: 200,
  }
  return response
}

const cases = [
  {
    body: JSON.stringify({ storeInNo: 'STORE-001' }),
    external: serverMocks.fetchSyneyStoreReportFromServer,
    genericError: '西尼入库单代理服务暂不可用',
    name: 'Syney',
    plugin: () => syneyStoreReportProxy(env),
  },
  {
    body: JSON.stringify({ purchaseOrderNo: 'PO-001' }),
    external: serverMocks.fetchYoumaiPurchaseOrderFromServer,
    genericError: '优迈采购订单代理服务暂不可用',
    name: 'Youmai',
    plugin: () => youmaiPurchaseOrderProxy(env),
  },
]

describe.each(cases)('$name Vite proxy security', (proxyCase) => {
  beforeEach(() => {
    proxyCase.external.mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns 401 without a Bearer token', async () => {
    const response = createResponse()

    await getMiddleware(proxyCase.plugin())(
      createRequest(proxyCase.body),
      response,
    )

    expect(response.statusCode).toBe(401)
    expect(proxyCase.external).not.toHaveBeenCalled()
  })

  it('returns 403 when the verified user lacks page permission', async () => {
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
    const response = createResponse()

    await getMiddleware(proxyCase.plugin())(
      createRequest(proxyCase.body, { authorization: 'Bearer access-token' }),
      response,
    )

    expect(response.statusCode).toBe(403)
    expect(proxyCase.external).not.toHaveBeenCalled()
  })

  it('returns 413 after reading more than 16 KiB of raw body bytes', async () => {
    const response = createResponse()
    const oversizedBody = JSON.stringify({ value: '界'.repeat(6_000) })

    await getMiddleware(proxyCase.plugin())(
      createRequest(oversizedBody),
      response,
    )

    expect(response.statusCode).toBe(413)
    expect(proxyCase.external).not.toHaveBeenCalled()
  })

  it('returns a generic 502 without exposing the upstream error', async () => {
    const upstreamError = new Error('sensitive upstream response')
    proxyCase.external.mockRejectedValue(upstreamError)
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        String(input).includes('/auth/v1/user')
          ? new Response(JSON.stringify({ id: `user-${proxyCase.name}` }), {
              status: 200,
            })
          : new Response(JSON.stringify(true), { status: 200 }),
      ),
    )
    const logSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const response = createResponse()

    await getMiddleware(proxyCase.plugin())(
      createRequest(proxyCase.body, {
        authorization: 'Bearer access-token',
        'x-forwarded-for': `192.0.2.${proxyCase.name === 'Syney' ? '10' : '11'}`,
      }),
      response,
    )

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ error: proxyCase.genericError })
    expect(logSpy.mock.calls.flat()).not.toContain(upstreamError)
  })
})
