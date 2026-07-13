'use strict'

const http = require('http')
const crypto = require('crypto')
const {
  authorizeProxyRequest,
  consumeDistributedRateLimit,
  diagnosticErrorCategory,
  extractBearerToken,
  parseProxyIdentifier,
  resolveAllowedOrigin,
  safeErrorMetadata,
} = require('./proxy-security')

const SCM_BASE_URL = 'http://scm.syney.net:808'
const LOGIN_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx?method=Login`
const STORE_REPORT_URL = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx?method=BindGrid`
const LOGIN_PAGE_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx`
const REPORT_PAGE_URL = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx`

const PORT = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000)
const SCM_REQUEST_TIMEOUT_MS = Number(
  process.env.SYNEY_SCM_REQUEST_TIMEOUT_MS || 15000,
)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || ''
const MAX_JSON_BODY_BYTES = 16 * 1024
const REQUIRED_PERMISSION = 'page:syney-store-report-list'

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

function getCorsOrigin(requestOrigin) {
  return resolveAllowedOrigin(requestOrigin, ALLOWED_ORIGIN)
}

function setCorsHeaders(req, res) {
  const allowedOrigin = getCorsOrigin(req.headers.origin)
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, authorization, x-requested-with',
  )
  res.setHeader('Vary', 'Origin')
}

function sendJson(req, res, statusCode, body) {
  setCorsHeaders(req, res)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(body))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let byteLength = 0
    let rejected = false

    req.on('data', (chunk) => {
      if (rejected) return
      byteLength += Buffer.byteLength(chunk)
      if (byteLength > MAX_JSON_BODY_BYTES) {
        rejected = true
        const error = new Error('Request body is too large')
        error.statusCode = 413
        reject(error)
        return
      }
      body += chunk
    })

    req.on('end', () => {
      if (!rejected) resolve(body)
    })
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const body = await readRequestBody(req)
  if (!body.trim()) {
    return {}
  }

  const payload = JSON.parse(body)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Request body must be a JSON object')
  }
  return payload
}

async function fetchWithTimeout(
  url,
  init = {},
  timeoutMessage = 'SCM timeout',
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCM_REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(timeoutMessage, { cause: error })
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function getPasswordHash() {
  const configuredHash = process.env.SYNEY_SCM_PASSWORD_MD5?.trim()
  if (configuredHash) {
    return configuredHash
  }

  const password = process.env.SYNEY_SCM_PASSWORD?.trim()
  return password ? crypto.createHash('md5').update(password).digest('hex') : ''
}

function getSetCookieValues(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const setCookie = headers.get('set-cookie')
  return setCookie ? [setCookie] : []
}

function appendResponseCookies(cookieMap, response) {
  getSetCookieValues(response.headers).forEach((setCookie) => {
    const cookiePair = setCookie.split(';')[0]
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

function serializeCookies(cookieMap) {
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

async function loginToScm() {
  const username = process.env.SYNEY_SCM_USERNAME?.trim()
  const passwordHash = getPasswordHash()

  if (!username || !passwordHash) {
    throw new Error('SYNEY_SCM_USERNAME or password env is not configured')
  }

  const loginBody = new URLSearchParams({
    UserName: username,
    PassWord: passwordHash,
  })
  const cookieMap = new Map()

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
    'Syney SCM login request timeout',
  )

  appendResponseCookies(cookieMap, loginResponse)

  const loginText = await loginResponse.text()
  if (!loginResponse.ok || !loginText.includes('成功')) {
    throw new Error(loginText || 'Syney SCM login failed')
  }

  return serializeCookies(cookieMap)
}

function extractDataArray(responseText) {
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
    startIndex += 1
  }

  if (responseText[startIndex] !== '[') {
    return ''
  }

  let depth = 1
  let inString = false
  let escaped = false

  for (let i = startIndex + 1; i < responseText.length; i += 1) {
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
      depth += 1
    } else if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return responseText.substring(startIndex, i + 1)
      }
    }
  }

  return ''
}

function parseStoreReportResponse(responseText) {
  const dataArrayText = extractDataArray(responseText)

  if (!dataArrayText) {
    throw new Error('Syney SCM returned an unexpected data format')
  }

  return JSON.parse(dataArrayText)
}

async function fetchStoreReport(storeInNo) {
  const cookie = await loginToScm()

  await fetchWithTimeout(
    REPORT_PAGE_URL,
    {
      headers: {
        Cookie: cookie,
        Referer: LOGIN_PAGE_URL,
      },
    },
    'Syney SCM report page request timeout',
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
    'Syney SCM store report query timeout',
  )

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(responseText || 'Syney SCM store report fetch failed')
  }

  return parseStoreReportResponse(responseText)
}

async function diagnoseScmAccess() {
  const startedAt = Date.now()

  try {
    const loginStartedAt = Date.now()
    const cookie = await loginToScm()

    return {
      ok: true,
      scmBaseUrl: SCM_BASE_URL,
      hasCookie: Boolean(cookie),
      loginElapsedMs: Date.now() - loginStartedAt,
      elapsedMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      ok: false,
      scmBaseUrl: SCM_BASE_URL,
      errorCategory: diagnosticErrorCategory(error),
      elapsedMs: Date.now() - startedAt,
    }
  }
}

async function handleRequest(req, res) {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(getCorsOrigin(req.headers.origin) ? 204 : 403)
    res.end()
    return
  }

  if (req.headers.origin && !getCorsOrigin(req.headers.origin)) {
    sendJson(req, res, 403, { error: 'Origin not allowed' })
    return
  }

  if (!['GET', 'POST'].includes(req.method)) {
    sendJson(req, res, 405, { error: 'Method not allowed' })
    return
  }

  if (!extractBearerToken(req.headers.authorization)) {
    sendJson(req, res, 401, { error: '未登录' })
    return
  }

  let payload = {}
  if (req.method === 'POST') {
    try {
      payload = await readJsonBody(req)
    } catch (error) {
      const statusCode = error?.statusCode === 413 ? 413 : 400
      sendJson(req, res, statusCode, {
        error: statusCode === 413 ? '请求体过大' : '请求体格式不正确',
      })
      return
    }
  }

  let access
  try {
    access = await authorizeProxyRequest({
      authorization: req.headers.authorization,
      diagnose: payload.diagnose === true,
      env: process.env,
      permission: REQUIRED_PERMISSION,
    })
  } catch (error) {
    console.error('aliyun_auth_failure', safeErrorMetadata(error))
    sendJson(req, res, 502, { error: '西尼入库单代理服务暂不可用' })
    return
  }
  if (!access.ok) {
    sendJson(req, res, access.status, {
      error: access.status === 401 ? '未登录' : '无权访问',
    })
    return
  }

  const requestIp =
    String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim() ||
    String(req.headers['x-real-ip'] || '').trim() ||
    req.socket.remoteAddress ||
    'unknown'
  try {
    if (
      !(await consumeDistributedRateLimit({
        authorization: req.headers.authorization,
        env: process.env,
        ip: requestIp,
        scope: 'syney-store-report',
      }))
    ) {
      sendJson(req, res, 429, { error: '请求过于频繁，请稍后重试' })
      return
    }
  } catch (error) {
    console.error('aliyun_rate_limit_failure', safeErrorMetadata(error))
    sendJson(req, res, 502, { error: '西尼入库单代理服务暂不可用' })
    return
  }

  if (req.method === 'GET') {
    sendJson(req, res, 200, {
      ok: true,
      service: 'syney-store-report',
      usage: 'POST JSON: {"storeInNo":"K202604270032"}',
    })
    return
  }

  try {
    if (payload.diagnose) {
      sendJson(req, res, 200, await diagnoseScmAccess())
      return
    }

    const storeInNo = parseProxyIdentifier(payload.storeInNo)
    if (!storeInNo) {
      sendJson(req, res, 400, { error: '入库单号长度必须为 1 到 64 个字符' })
      return
    }

    const items = await fetchStoreReport(storeInNo)
    sendJson(req, res, 200, {
      storeInNo,
      total: items.length,
      items,
    })
  } catch (error) {
    console.error('aliyun_upstream_failure', safeErrorMetadata(error))
    sendJson(req, res, 502, { error: '西尼入库单代理服务暂不可用' })
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('aliyun_unhandled_failure', safeErrorMetadata(error))
    sendJson(req, res, 502, { error: '西尼入库单代理服务暂不可用' })
  })
})

server.keepAliveTimeout = 0
server.headersTimeout = 0

server.listen(PORT, '0.0.0.0', () => {
  console.log(`syney-store-report server listening on ${PORT}`)
})
