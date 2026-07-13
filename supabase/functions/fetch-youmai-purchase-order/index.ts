import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import {
  authorizeEdgeProxyRequest,
  consumeEdgeProxyRateLimit,
  diagnosticErrorCategory,
  getProxyCorsHeaders,
  hasBearerAuthorization,
  isProxyOriginAllowed,
  parseProxyIdentifier,
  readLimitedJsonBody,
  safeErrorMetadata,
} from '../_shared/proxy-security.ts'

const YOUMAI_SRM_BASE_URL = 'https://srm.hzoptimax.com/saafbase'
const LOGIN_URL = `${YOUMAI_SRM_BASE_URL}/restServer/saafLoginServlet/login`
const ORDER_LIST_URL = `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfoList`
const ORDER_LINES_URL = `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfo`
const REQUEST_TIMEOUT_MS = 20000

type YoumaiPurchaseOrderPayload = {
  purchaseOrderNo?: string
  diagnose?: boolean
}

type YoumaiSrmLoginData = {
  sessionId?: string
  tokeCode?: string
}

type YoumaiSrmResponse<T> = {
  status?: string
  msg?: string
  data?: T
  count?: number
}

type YoumaiSrmOrderHeader = {
  poHeaderId?: number | string
  poNumber?: string
}

type YoumaiSrmOrderLine = {
  poNumber?: string
  lineNumber?: number | string
  itemCode?: string
  itemName?: string
  demandQty?: number | string
  demandDate?: string
  description?: string
  lineDescription?: string
  contractNumber?: string
  packingItem?: string
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeQuantity(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getCredentials() {
  const username = Deno.env.get('YOUMAI_SRM_USERNAME')?.trim()
  const password = Deno.env.get('YOUMAI_SRM_PASSWORD')?.trim()

  if (!username || !password) {
    throw new Error('优迈 SRM 账号环境变量未配置')
  }

  return { username, password }
}

function getSetCookieValues(headers: Headers) {
  const maybeHeadersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  const setCookies = maybeHeadersWithSetCookie.getSetCookie?.()
  if (setCookies?.length) {
    return setCookies
  }

  const setCookie = headers.get('set-cookie')
  return setCookie ? [setCookie] : []
}

function appendResponseCookies(
  cookieMap: Map<string, string>,
  response: Response,
) {
  getSetCookieValues(response.headers).forEach((setCookie) => {
    const [cookiePair] = setCookie.split(';')
    const separatorIndex = cookiePair.indexOf('=')

    if (separatorIndex <= 0) {
      return
    }

    cookieMap.set(
      cookiePair.slice(0, separatorIndex).trim(),
      cookiePair.slice(separatorIndex + 1).trim(),
    )
  })
}

function serializeCookies(cookieMap: Map<string, string>) {
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMessage: string,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(timeoutMessage, { cause: error })
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function runDiagnosticStep(
  name: string,
  input: string,
  init: RequestInit = {},
) {
  const startedAt = Date.now()

  try {
    const response = await fetchWithTimeout(input, init, `${name} 超时`)

    return {
      name,
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      name,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      errorCategory: diagnosticErrorCategory(error),
    }
  }
}

async function diagnoseYoumaiSrmAccess() {
  const username = Deno.env.get('YOUMAI_SRM_USERNAME')?.trim()
  const password = Deno.env.get('YOUMAI_SRM_PASSWORD')?.trim()
  const steps = [
    await runDiagnosticStep('public_https', 'https://example.com'),
    await runDiagnosticStep('youmai_srm_index', `${YOUMAI_SRM_BASE_URL}/`),
  ]

  if (username && password) {
    steps.push(
      await runDiagnosticStep('youmai_srm_login', LOGIN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Referer: `${YOUMAI_SRM_BASE_URL}/`,
        },
        body: new URLSearchParams({
          params: JSON.stringify({
            username,
            password,
            check: '',
          }),
        }),
      }),
    )
  }

  return {
    region: Deno.env.get('SB_REGION') || Deno.env.get('DENO_REGION') || '',
    youmaiSrmBaseUrl: YOUMAI_SRM_BASE_URL,
    timeoutMs: REQUEST_TIMEOUT_MS,
    env: {
      hasUsername: Boolean(username),
      hasPassword: Boolean(password),
    },
    steps,
  }
}

async function postSrmForm<T>({
  url,
  params,
  tokenCode,
  cookie,
  pageRows = '200',
}: {
  url: string
  params: Record<string, unknown>
  tokenCode: string
  cookie: string
  pageRows?: string
}) {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: cookie,
        Origin: YOUMAI_SRM_BASE_URL,
        Referer: `${YOUMAI_SRM_BASE_URL}/`,
        TokenCode: tokenCode,
      },
      body: new URLSearchParams({
        params: JSON.stringify(params),
        pageIndex: '1',
        pageRows,
      }),
    },
    '优迈 SRM 请求超时',
  )

  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || '优迈 SRM 请求失败')
  }

  return JSON.parse(text) as YoumaiSrmResponse<T>
}

async function loginToYoumaiSrm() {
  const { username, password } = getCredentials()
  const cookieMap = new Map<string, string>()
  const response = await fetchWithTimeout(
    LOGIN_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Referer: `${YOUMAI_SRM_BASE_URL}/`,
      },
      body: new URLSearchParams({
        params: JSON.stringify({
          username,
          password,
          check: '',
        }),
      }),
    },
    '优迈 SRM 登录请求超时',
  )

  appendResponseCookies(cookieMap, response)

  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || '优迈 SRM 登录失败')
  }

  const loginResponse = JSON.parse(text) as YoumaiSrmResponse<string>
  if (loginResponse.status !== 'S' || !loginResponse.data) {
    throw new Error(loginResponse.msg || '优迈 SRM 登录失败')
  }

  const loginData = JSON.parse(loginResponse.data) as YoumaiSrmLoginData
  const sessionId = normalizeText(loginData.sessionId)
  if (sessionId) {
    cookieMap.set('JSESSIONID', sessionId)
  }

  return {
    cookie: serializeCookies(cookieMap),
    tokenCode: normalizeText(loginData.tokeCode),
  }
}

function buildLineRemarks(line: YoumaiSrmOrderLine) {
  return [
    normalizeText(line.description),
    normalizeText(line.lineDescription),
    normalizeText(line.contractNumber)
      ? `合同号：${normalizeText(line.contractNumber)}`
      : '',
    normalizeText(line.packingItem)
      ? `打包件：${normalizeText(line.packingItem)}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500)
}

function mapOrderLine(line: YoumaiSrmOrderLine) {
  return {
    purchase_order_no: normalizeText(line.poNumber),
    purchase_order_line_no: normalizeText(line.lineNumber),
    material_code: normalizeText(line.itemCode),
    material_name: normalizeText(line.itemName),
    delivery_date: normalizeText(line.demandDate),
    stock_out_quantity: normalizeQuantity(line.demandQty),
    remarks: buildLineRemarks(line),
  }
}

async function fetchYoumaiPurchaseOrder(purchaseOrderNo: string) {
  const session = await loginToYoumaiSrm()
  const headerResponse = await postSrmForm<YoumaiSrmOrderHeader[]>({
    url: ORDER_LIST_URL,
    params: { poNumber: purchaseOrderNo },
    cookie: session.cookie,
    tokenCode: session.tokenCode,
    pageRows: '20',
  })

  const orderHeader = (headerResponse.data || []).find(
    (item) => normalizeText(item.poNumber) === purchaseOrderNo,
  )

  if (!orderHeader?.poHeaderId) {
    throw new Error(`未找到优迈采购订单：${purchaseOrderNo}`)
  }

  const linesResponse = await postSrmForm<YoumaiSrmOrderLine[]>({
    url: ORDER_LINES_URL,
    params: { poHeaderId: orderHeader.poHeaderId },
    cookie: session.cookie,
    tokenCode: session.tokenCode,
  })

  const items = (linesResponse.data || []).map(mapOrderLine).filter((line) => {
    return (
      line.purchase_order_no &&
      line.purchase_order_line_no &&
      line.material_code &&
      line.stock_out_quantity > 0 &&
      line.delivery_date
    )
  })

  if (items.length === 0) {
    throw new Error(`优迈采购订单 ${purchaseOrderNo} 没有可导入明细`)
  }

  return items
}

serve(async (request: Request) => {
  const corsHeaders = getProxyCorsHeaders(request)
  const respond = (body: Record<string, unknown>, status = 200) =>
    jsonResponse(body, status, corsHeaders)

  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      status: isProxyOriginAllowed(request) ? 204 : 403,
      headers: corsHeaders,
    })
  }

  if (!isProxyOriginAllowed(request)) {
    return respond({ error: 'Origin not allowed' }, 403)
  }

  if (request.method !== 'POST') {
    return respond({ error: 'Method not allowed' }, 405)
  }

  if (!hasBearerAuthorization(request)) {
    return respond({ error: '未登录，无法获取优迈采购订单' }, 401)
  }

  const bodyResult =
    await readLimitedJsonBody<YoumaiPurchaseOrderPayload>(request)
  if (!bodyResult.ok) {
    return respond(
      { error: bodyResult.status === 413 ? '请求体过大' : '请求体格式不正确' },
      bodyResult.status,
    )
  }
  const payload = bodyResult.payload

  let access
  try {
    access = await authorizeEdgeProxyRequest(
      request,
      'page:youmai-finished-goods-stock-out',
      payload.diagnose === true,
    )
  } catch (error) {
    console.error('youmai_edge_auth_failure', safeErrorMetadata(error))
    return respond({ error: '优迈采购订单代理服务暂不可用' }, 502)
  }
  if (!access.ok) {
    return respond(
      {
        error:
          access.status === 401 ? '未登录，无法获取优迈采购订单' : '无权访问',
      },
      access.status,
    )
  }
  try {
    if (!(await consumeEdgeProxyRateLimit(request, 'youmai-purchase-order'))) {
      return respond({ error: '请求过于频繁，请稍后重试' }, 429)
    }
  } catch (error) {
    console.error('youmai_edge_rate_limit_failure', safeErrorMetadata(error))
    return respond({ error: '优迈采购订单代理服务暂不可用' }, 502)
  }

  try {
    if (payload.diagnose) {
      return respond(await diagnoseYoumaiSrmAccess())
    }

    const purchaseOrderNo = parseProxyIdentifier(payload.purchaseOrderNo)
    if (!purchaseOrderNo) {
      return respond({ error: '采购订单号长度必须为 1 到 64 个字符' }, 400)
    }

    const items = await fetchYoumaiPurchaseOrder(purchaseOrderNo)

    return respond({
      purchaseOrderNo,
      total: items.length,
      items,
    })
  } catch (error) {
    console.error('youmai_edge_upstream_failure', safeErrorMetadata(error))
    return respond({ error: '优迈采购订单代理服务暂不可用' }, 502)
  }
})
