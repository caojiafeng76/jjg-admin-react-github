import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { corsHeaders } from '../_shared/cors.ts'

const YOUMAI_SRM_BASE_URL = 'https://srm.hzoptimax.com/saafbase'
const LOGIN_URL = `${YOUMAI_SRM_BASE_URL}/restServer/saafLoginServlet/login`
const ORDER_LIST_URL =
  `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfoList`
const ORDER_LINES_URL =
  `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfo`
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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getAuthorizationRole(authorization: string) {
  const token = authorization.replace(/^Bearer\s+/i, '')
  const payloadPart = token.split('.')[1]

  if (!payloadPart) {
    return ''
  }

  try {
    const normalizedPayload = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, '=')
    const payload = JSON.parse(atob(normalizedPayload)) as { role?: string }

    return payload.role || ''
  } catch {
    return ''
  }
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

function appendResponseCookies(cookieMap: Map<string, string>, response: Response) {
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
    const body = await response.clone().text().catch(() => '')

    return {
      name,
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      bodyPreview: body.slice(0, 120),
    }
  } catch (error) {
    return {
      name,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return jsonResponse({ error: '未登录，无法获取优迈采购订单' }, 401)
  }

  if (getAuthorizationRole(authorization) !== 'authenticated') {
    return jsonResponse({ error: '未登录，无法获取优迈采购订单' }, 401)
  }

  let payload: YoumaiPurchaseOrderPayload

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  try {
    if (payload.diagnose) {
      return jsonResponse(await diagnoseYoumaiSrmAccess())
    }

    const purchaseOrderNo = payload.purchaseOrderNo?.trim()
    if (!purchaseOrderNo) {
      return jsonResponse({ error: '请输入采购订单号' }, 400)
    }

    const items = await fetchYoumaiPurchaseOrder(purchaseOrderNo)

    return jsonResponse({
      purchaseOrderNo,
      total: items.length,
      items,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '优迈采购订单获取失败'
    return jsonResponse({ error: message }, 500)
  }
})
