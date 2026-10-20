'use strict'

const http = require('node:http')
const https = require('node:https')

const PORT = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000)
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 60000)

const ALLOWED_PATH_PREFIXES = [
  '/rest/v1/',
  '/auth/v1/',
  '/storage/v1/',
  '/functions/v1/',
]

// RFC 7230 hop-by-hop 头，只对单跳连接有效，不能转发
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function parseUpstreamUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) {
    throw new Error('SUPABASE_URL is required')
  }

  const url = new URL(raw)
  if (url.protocol !== 'https:') {
    throw new Error('SUPABASE_URL must use https')
  }

  return url
}

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

function isAllowedPath(path) {
  const pathname = String(path || '').split('?')[0]

  if (pathname.includes('..') || pathname.includes('\\')) {
    return false
  }

  return ALLOWED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true
  }

  // 非浏览器请求（curl、服务端）不带 Origin，交给 Supabase 自身鉴权
  if (!origin) {
    return true
  }

  return allowedOrigins.includes(String(origin).replace(/\/$/, ''))
}

function connectionHeaderTokens(headers) {
  const value = headers.connection
  if (!value) {
    return new Set()
  }

  return new Set(
    String(value)
      .split(',')
      .map(token => token.trim().toLowerCase())
      .filter(Boolean),
  )
}

function stripHopByHopHeaders(headers) {
  const extraTokens = connectionHeaderTokens(headers)
  const result = {}

  for (const [name, value] of Object.entries(headers)) {
    const lowerName = name.toLowerCase()
    if (
      value === undefined
      || HOP_BY_HOP_HEADERS.has(lowerName)
      || extraTokens.has(lowerName)
    ) {
      continue
    }
    result[lowerName] = value
  }

  return result
}

function buildUpstreamHeaders(headers, upstreamUrl) {
  const result = stripHopByHopHeaders(headers)
  result.host = upstreamUrl.host
  return result
}

function filterResponseHeaders(headers) {
  return stripHopByHopHeaders(headers)
}

function sendJson(res, statusCode, body) {
  if (res.headersSent) {
    res.destroy()
    return
  }

  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(body))
}

function createProxyHandler({
  upstreamUrl,
  allowedOrigins = [],
  timeoutMs = UPSTREAM_TIMEOUT_MS,
  requestImpl = https.request,
  agent = new https.Agent({ keepAlive: true, maxSockets: 64 }),
}) {
  return function handleRequest(req, res) {
    const path = req.url || '/'

    if (req.method === 'GET' && path === '/healthz') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (!isAllowedPath(path)) {
      sendJson(res, 404, { message: 'Not found' })
      return
    }

    if (!isOriginAllowed(req.headers.origin, allowedOrigins)) {
      sendJson(res, 403, { message: 'Origin not allowed' })
      return
    }

    const upstreamReq = requestImpl({
      agent,
      headers: buildUpstreamHeaders(req.headers, upstreamUrl),
      hostname: upstreamUrl.hostname,
      method: req.method,
      path,
      port: upstreamUrl.port || 443,
      protocol: upstreamUrl.protocol,
      timeout: timeoutMs,
    })

    upstreamReq.on('response', (upstreamRes) => {
      res.writeHead(
        upstreamRes.statusCode || 502,
        filterResponseHeaders(upstreamRes.headers),
      )
      upstreamRes.pipe(res)
    })

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error('Upstream timeout'))
    })

    upstreamReq.on('error', (error) => {
      console.error('supabase-proxy upstream error', {
        method: req.method,
        path: path.split('?')[0],
        reason: error && error.message,
      })
      sendJson(res, 502, { message: 'Upstream request failed' })
    })

    // 客户端提前断开时取消上游请求
    res.on('close', () => {
      if (!res.writableFinished) {
        upstreamReq.destroy()
      }
    })

    req.pipe(upstreamReq)
  }
}

if (require.main === module) {
  const upstreamUrl = parseUpstreamUrl(process.env.SUPABASE_URL)
  const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS)
  const server = http.createServer(
    createProxyHandler({ upstreamUrl, allowedOrigins }),
  )

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`supabase-proxy listening on ${PORT} -> ${upstreamUrl.host}`)
  })
}

module.exports = {
  buildUpstreamHeaders,
  createProxyHandler,
  filterResponseHeaders,
  isAllowedPath,
  isOriginAllowed,
  parseAllowedOrigins,
  parseUpstreamUrl,
}
