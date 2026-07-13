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

const SCM_BASE_URL = 'http://scm.syney.net:808'
const LOGIN_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx?method=Login`
const STORE_REPORT_URL = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx?method=BindGrid`
const LOGIN_PAGE_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx`
const REPORT_PAGE_URL = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx`
const SCM_REQUEST_TIMEOUT_MS = 15000

const BIND_FIELDS = [
  '',
  'No',
  'CreateOn',
  'SupplierName',
  'InventoryOrderStatus',
  'SupplierCode',
  'SortNo',
  'PartNo',
  'PartName',
  'Spec',
  'ParamSpec',
  'Qty',
  'Unit',
  'SupplierWeight',
  'SyneyWeight',
  'CalculateUnit',
  'HasReturn',
  'ReturnQty',
  'DeliveryOrderNo',
  'DeliveryPartSortNo',
  'PONo',
  'EndDate',
  'AuditDate',
  'Address',
  'SONo',
  'InventoryType',
  'Remark',
].join(',')

type SyneyStoreReportItem = {
  No: string | null
  ParamSpec: string | null
  PartName: string | null
  PartNo: string | null
  Qty: number | null
  Remark: string | null
  SONo: string | null
  Spec: string | null
  TaxUnitPrice?: number | null
  Unit: string | null
}

type SyneyStoreReportPayload = {
  storeInNo?: string
  diagnose?: boolean
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
  timeoutMessage = '西尼 SCM 请求超时',
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCM_REQUEST_TIMEOUT_MS)

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

function getRuntimeRegion() {
  return Deno.env.get('SB_REGION') || Deno.env.get('DENO_REGION') || ''
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

async function diagnoseScmAccess() {
  const username = Deno.env.get('SYNEY_SCM_USERNAME')?.trim()
  const passwordHash = getPasswordHash()
  const steps = [
    await runDiagnosticStep('public_https', 'https://example.com'),
    await runDiagnosticStep('scm_login_page', LOGIN_PAGE_URL, {
      headers: {
        Referer: LOGIN_PAGE_URL,
      },
    }),
  ]

  if (username && passwordHash) {
    const loginBody = new URLSearchParams({
      UserName: username,
      PassWord: passwordHash,
    })

    steps.push(
      await runDiagnosticStep('scm_login_post', LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: LOGIN_PAGE_URL,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: loginBody,
      }),
    )
  }

  return {
    region: getRuntimeRegion(),
    scmBaseUrl: SCM_BASE_URL,
    timeoutMs: SCM_REQUEST_TIMEOUT_MS,
    env: {
      hasUsername: Boolean(username),
      hasPasswordHash: Boolean(passwordHash),
    },
    steps,
  }
}

function add32(a: number, b: number) {
  return (a + b) & 0xffffffff
}

function rotateLeft(value: number, shift: number) {
  return (value << shift) | (value >>> (32 - shift))
}

function md5(input: string) {
  const bytes = new TextEncoder().encode(input)
  const originalBitLength = bytes.length * 8
  const paddedLength = (((bytes.length + 8) >> 6) + 1) << 6
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, originalBitLength, true)
  view.setUint32(
    paddedLength - 4,
    Math.floor(originalBitLength / 0x100000000),
    true,
  )

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ]
  const constants = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000),
  )

  for (let offset = 0; offset < paddedLength; offset += 64) {
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    const words = Array.from({ length: 16 }, (_, i) =>
      view.getUint32(offset + i * 4, true),
    )

    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number

      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }

      const temp = d
      d = c
      c = b
      b = add32(
        b,
        rotateLeft(
          add32(add32(a, f), add32(constants[i], words[g])),
          shifts[i],
        ),
      )
      a = temp
    }

    a0 = add32(a0, a)
    b0 = add32(b0, b)
    c0 = add32(c0, c)
    d0 = add32(d0, d)
  }

  return [a0, b0, c0, d0]
    .map((word) =>
      Array.from({ length: 4 }, (_, i) =>
        ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0'),
      ).join(''),
    )
    .join('')
}

function getPasswordHash() {
  const configuredHash = Deno.env.get('SYNEY_SCM_PASSWORD_MD5')?.trim()
  if (configuredHash) {
    return configuredHash
  }

  const password = Deno.env.get('SYNEY_SCM_PASSWORD')?.trim()
  return password ? md5(password) : ''
}

async function loginToScm() {
  const username = Deno.env.get('SYNEY_SCM_USERNAME')?.trim()
  const passwordHash = getPasswordHash()

  if (!username || !passwordHash) {
    throw new Error('西尼 SCM 账号环境变量未配置')
  }

  const loginBody = new URLSearchParams({
    UserName: username,
    PassWord: passwordHash,
  })

  const cookieMap = new Map<string, string>()

  const loginResponse = await fetchWithTimeout(
    LOGIN_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: serializeCookies(cookieMap),
        Referer: LOGIN_PAGE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: loginBody,
    },
    '西尼 SCM 登录请求超时',
  )
  appendResponseCookies(cookieMap, loginResponse)

  const loginText = await loginResponse.text()
  if (!loginResponse.ok || !loginText.includes('成功')) {
    throw new Error(loginText || '西尼 SCM 登录失败')
  }

  return serializeCookies(cookieMap)
}

function extractDataArray(responseText: string) {
  const dataKeyStart = responseText.indexOf('data')
  if (dataKeyStart === -1) {
    return ''
  }

  const colonIndex = responseText.indexOf(':', dataKeyStart)
  if (colonIndex === -1) {
    return ''
  }

  let startIndex = colonIndex + 1
  while (
    startIndex < responseText.length &&
    /\s/.test(responseText[startIndex])
  ) {
    startIndex++
  }

  if (responseText[startIndex] !== '[') {
    return ''
  }

  let depth = 1
  let inString = false
  let escaped = false

  for (let i = startIndex + 1; i < responseText.length; i++) {
    const char = responseText[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '[') {
      depth++
    } else if (char === ']') {
      depth--
      if (depth === 0) {
        return responseText.substring(startIndex, i + 1)
      }
    }
  }

  return ''
}

function parseStoreReportResponse(responseText: string) {
  const dataArrayText = extractDataArray(responseText)

  if (!dataArrayText) {
    throw new Error('西尼 SCM 返回数据格式不正确')
  }

  return JSON.parse(dataArrayText) as SyneyStoreReportItem[]
}

async function fetchStoreReport(storeInNo: string) {
  const cookie = await loginToScm()
  await fetchWithTimeout(
    REPORT_PAGE_URL,
    {
      headers: {
        Cookie: cookie,
        Referer: LOGIN_PAGE_URL,
      },
    },
    '西尼 SCM 入库单页面请求超时',
  )

  const body = new URLSearchParams({
    BindFields: BIND_FIELDS,
    SearchParams: `&QUERY_S_No=${storeInNo}`,
    pageIndex: '0',
    pageSize: '200',
    sortField: 'CreateOn',
    sortOrder: 'desc',
  })

  const response = await fetchWithTimeout(
    STORE_REPORT_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'text/plain, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
        Origin: SCM_BASE_URL,
        Referer: REPORT_PAGE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
    },
    '西尼 SCM 入库单查询超时',
  )

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(responseText || '西尼 SCM 入库单获取失败')
  }

  return parseStoreReportResponse(responseText)
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
    return respond({ error: '未登录，无法获取西尼入库单' }, 401)
  }

  const bodyResult = await readLimitedJsonBody<SyneyStoreReportPayload>(request)
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
      'page:syney-store-report-list',
      payload.diagnose === true,
    )
  } catch (error) {
    console.error('syney_edge_auth_failure', safeErrorMetadata(error))
    return respond({ error: '西尼入库单代理服务暂不可用' }, 502)
  }
  if (!access.ok) {
    return respond(
      {
        error:
          access.status === 401 ? '未登录，无法获取西尼入库单' : '无权访问',
      },
      access.status,
    )
  }
  try {
    if (!(await consumeEdgeProxyRateLimit(request, 'syney-store-report'))) {
      return respond({ error: '请求过于频繁，请稍后重试' }, 429)
    }
  } catch (error) {
    console.error('syney_edge_rate_limit_failure', safeErrorMetadata(error))
    return respond({ error: '西尼入库单代理服务暂不可用' }, 502)
  }

  try {
    if (payload.diagnose) {
      return respond(await diagnoseScmAccess())
    }

    const storeInNo = parseProxyIdentifier(payload.storeInNo)
    if (!storeInNo) {
      return respond({ error: '入库单号长度必须为 1 到 64 个字符' }, 400)
    }

    const items = await fetchStoreReport(storeInNo)

    return respond({
      storeInNo,
      total: items.length,
      items,
    })
  } catch (error) {
    console.error('syney_edge_upstream_failure', safeErrorMetadata(error))
    return respond({ error: '西尼入库单代理服务暂不可用' }, 502)
  }
})
