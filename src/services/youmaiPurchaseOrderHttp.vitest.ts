import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { YoumaiSrmUserError } from '../../server/youmaiPurchaseOrderErrors'
import { createYoumaiPurchaseOrderHandler } from '../../server/youmaiPurchaseOrderHttp'
import { fetchYoumaiPurchaseOrderFromServer } from '../../server/youmaiPurchaseOrderServer'

vi.mock('../../server/youmaiPurchaseOrderServer', () => ({
  fetchYoumaiPurchaseOrderFromServer: vi.fn(),
}))

const env = {
  ALLOWED_ORIGIN: 'https://app.example.com',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_URL: 'https://project.supabase.co',
}

const fetchOrder = vi.mocked(fetchYoumaiPurchaseOrderFromServer)

function createResponse() {
  const response = {
    statusCode: 200,
    body: '',
    setHeader: vi.fn(),
    end: (chunk?: string) => {
      response.body = chunk ?? ''
    },
  }
  return response
}

function createRequest(headers: Record<string, string>, method = 'POST', body = '') {
  return Object.assign(Readable.from(body ? [body] : []), {
    method,
    headers: {
      ...headers,
      'content-length': String(Buffer.byteLength(body)),
    },
    socket: {},
  }) as unknown as IncomingMessage
}

/** 走完登录、权限和限流校验的请求 */
async function postOrder(purchaseOrderNo: unknown = 'PO-001') {
  const response = createResponse()
  await createYoumaiPurchaseOrderHandler(env)(
    createRequest(
      { origin: env.ALLOWED_ORIGIN, authorization: 'Bearer token' },
      'POST',
      JSON.stringify({ purchaseOrderNo }),
    ),
    response as unknown as ServerResponse,
  )
  return response
}

describe('createYoumaiPurchaseOrderHandler', () => {
  beforeEach(() => {
    fetchOrder.mockReset()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      url.endsWith('/auth/v1/user')
        ? Response.json({ id: 'user-1' })
        : Response.json(true)
    )))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the order lines in the shape the frontend expects', async () => {
    const items = [{ purchase_order_no: 'PO-001' }]
    fetchOrder.mockResolvedValue(items as never)

    const response = await postOrder()

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      purchaseOrderNo: 'PO-001',
      total: 1,
      items,
    })
  })

  it('shows user errors such as a login timeout as 422', async () => {
    fetchOrder.mockRejectedValue(new YoumaiSrmUserError('优迈 SRM 登录请求超时'))

    const response = await postOrder()

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({ error: '优迈 SRM 登录请求超时' })
  })

  it('hides other upstream errors behind a generic 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchOrder.mockRejectedValue(new Error('sensitive upstream response'))

    const response = await postOrder()

    expect(response.statusCode).toBe(502)
    expect(JSON.parse(response.body)).toEqual({
      error: '优迈采购订单代理服务暂不可用',
    })
  })

  it('rejects a missing purchase order number without calling SRM', async () => {
    const response = await postOrder('   ')

    expect(response.statusCode).toBe(400)
    expect(fetchOrder).not.toHaveBeenCalled()
  })
})

describe('fetchYoumaiPurchaseOrderFromServer errors', () => {
  const srmEnv = { YOUMAI_SRM_USERNAME: 'user', YOUMAI_SRM_PASSWORD: 'secret' }

  async function fetchOrderWith(fetchImpl: () => Promise<Response>) {
    vi.stubGlobal('fetch', vi.fn(fetchImpl))
    const { fetchYoumaiPurchaseOrderFromServer: fetchReal } = await vi.importActual<
      typeof import('../../server/youmaiPurchaseOrderServer')
    >('../../server/youmaiPurchaseOrderServer')
    return fetchReal(srmEnv, 'PO-001')
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports a login timeout as a user error', async () => {
    await expect(
      fetchOrderWith(() => Promise.reject(new DOMException('aborted', 'AbortError'))),
    ).rejects.toMatchObject({
      name: 'YoumaiSrmUserError',
      message: '优迈 SRM 登录请求超时',
    })
  })

  it('reports a network failure and logs only the error code', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const networkError = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect srm.example.com'), { code: 'ECONNRESET' }),
    })

    await expect(
      fetchOrderWith(() => Promise.reject(networkError)),
    ).rejects.toMatchObject({
      name: 'YoumaiSrmUserError',
      message: '无法连接优迈 SRM',
    })
    expect(logSpy).toHaveBeenCalledWith('youmai_srm_network_failure', { code: 'ECONNRESET' })
  })

  it('includes the SRM login message', async () => {
    await expect(
      fetchOrderWith(async () => Response.json({ status: 'E', msg: '密码错误' })),
    ).rejects.toMatchObject({
      name: 'YoumaiSrmUserError',
      message: '优迈 SRM 登录失败：密码错误',
    })
  })

  it('keeps a non-2xx response body out of user errors', async () => {
    const error = await fetchOrderWith(
      async () => new Response('<html>sensitive</html>', { status: 500 }),
    ).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(YoumaiSrmUserError)
  })
})

describe('createYoumaiPurchaseOrderHandler origin check', () => {
  const noOriginEnv = { ALLOWED_ORIGIN: '' }
  const sameOriginHeaders = {
    origin: 'https://localhost:5173',
    host: 'localhost:5173',
  }

  it('rejects same-origin requests by default', async () => {
    const response = createResponse()
    await createYoumaiPurchaseOrderHandler(noOriginEnv)(
      createRequest(sameOriginHeaders, 'GET'),
      response as unknown as ServerResponse,
    )
    expect(response.statusCode).toBe(403)
  })

  it('lets same-origin requests through when allowSameOrigin is on', async () => {
    const response = createResponse()
    await createYoumaiPurchaseOrderHandler(noOriginEnv, { allowSameOrigin: true })(
      createRequest(sameOriginHeaders, 'GET'),
      response as unknown as ServerResponse,
    )
    // 通过了来源校验，止步于方法校验（GET）
    expect(response.statusCode).toBe(405)
  })

  it('still rejects other origins when allowSameOrigin is on', async () => {
    const response = createResponse()
    await createYoumaiPurchaseOrderHandler(noOriginEnv, { allowSameOrigin: true })(
      createRequest({ origin: 'https://evil.example.com', host: 'localhost:5173' }, 'GET'),
      response as unknown as ServerResponse,
    )
    expect(response.statusCode).toBe(403)
  })
})
