'use strict'

const http = require('http')
const crypto = require('crypto')

const SCM_BASE_URL = 'http://scm.syney.net:808'
const LOGIN_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx?method=Login`
const STORE_REPORT_URL =
  `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx?method=BindGrid`
const LOGIN_PAGE_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx`
const REPORT_PAGE_URL =
  `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx`

const PORT = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000)
const SCM_REQUEST_TIMEOUT_MS = Number(
  process.env.SYNEY_SCM_REQUEST_TIMEOUT_MS || 15000,
)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

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
  if (!ALLOWED_ORIGIN || ALLOWED_ORIGIN === '*') {
    return '*'
  }

  const origins = ALLOWED_ORIGIN.split(',').map((origin) => origin.trim())
  return origins.includes(requestOrigin) ? requestOrigin : origins[0]
}

function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req.headers.origin))
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

    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large'))
        req.destroy()
      }
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const body = await readRequestBody(req)
  if (!body.trim()) {
    return {}
  }

  return JSON.parse(body)
}

async function fetchWithTimeout(url, init = {}, timeoutMessage = 'SCM timeout') {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCM_REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(timeoutMessage)
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
  return password
    ? crypto.createHash('md5').update(password).digest('hex')
    : ''
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
  while (startIndex < responseText.length && /\s/.test(responseText[startIndex])) {
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
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - startedAt,
    }
  }
}

async function handleRequest(req, res) {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
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

  if (req.method !== 'POST') {
    sendJson(req, res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const payload = await readJsonBody(req)

    if (payload.diagnose) {
      sendJson(req, res, 200, await diagnoseScmAccess())
      return
    }

    const storeInNo = String(payload.storeInNo || '').trim()
    if (!storeInNo) {
      sendJson(req, res, 400, { error: '请输入入库单号' })
      return
    }

    const items = await fetchStoreReport(storeInNo)
    sendJson(req, res, 200, {
      storeInNo,
      total: items.length,
      items,
    })
  } catch (error) {
    console.error(error)
    sendJson(req, res, 500, {
      error: error instanceof Error ? error.message : '西尼入库单获取失败',
    })
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error)
    sendJson(req, res, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  })
})

server.keepAliveTimeout = 0
server.headersTimeout = 0

server.listen(PORT, '0.0.0.0', () => {
  console.log(`syney-store-report server listening on ${PORT}`)
})
