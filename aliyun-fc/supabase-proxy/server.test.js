'use strict'

const assert = require('node:assert/strict')
const http = require('node:http')
const test = require('node:test')

const {
  buildUpstreamHeaders,
  createProxyHandler,
  filterResponseHeaders,
  isAllowedPath,
  isOriginAllowed,
  parseAllowedOrigins,
  parseUpstreamUrl,
} = require('./server')

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

function close(server) {
  return new Promise((resolve) => server.close(resolve))
}

async function withProxy(upstreamHandler, options, run) {
  const upstream = http.createServer(upstreamHandler)
  const upstreamPort = await listen(upstream)
  const agent = new http.Agent()
  const proxy = http.createServer(
    createProxyHandler({
      agent,
      requestImpl: http.request,
      upstreamUrl: new URL(`http://127.0.0.1:${upstreamPort}`),
      ...options,
    }),
  )
  const proxyPort = await listen(proxy)

  try {
    await run(`http://127.0.0.1:${proxyPort}`)
  } finally {
    agent.destroy()
    await close(proxy)
    await close(upstream)
  }
}

test('only Supabase API prefixes are proxied', () => {
  assert.equal(isAllowedPath('/rest/v1/employees?select=id'), true)
  assert.equal(isAllowedPath('/auth/v1/token?grant_type=refresh_token'), true)
  assert.equal(isAllowedPath('/storage/v1/object/sign/bucket/a.png'), true)
  assert.equal(isAllowedPath('/functions/v1/create-employee-auth'), true)
  assert.equal(isAllowedPath('/'), false)
  assert.equal(isAllowedPath('/realtime/v1/websocket'), false)
  assert.equal(isAllowedPath('/rest/v1/../pg-meta'), false)
  assert.equal(isAllowedPath('/rest/v1'), false)
})

test('hop-by-hop headers are stripped and host is rewritten', () => {
  const upstreamUrl = new URL('https://project.supabase.co')
  const headers = buildUpstreamHeaders(
    {
      apikey: 'key',
      authorization: 'Bearer token',
      connection: 'keep-alive, x-custom-hop',
      host: 'proxy.example.com',
      'keep-alive': 'timeout=5',
      'transfer-encoding': 'chunked',
      'x-custom-hop': '1',
    },
    upstreamUrl,
  )

  assert.deepEqual(headers, {
    apikey: 'key',
    authorization: 'Bearer token',
    host: 'project.supabase.co',
  })
  assert.deepEqual(
    filterResponseHeaders({
      'access-control-allow-origin': '*',
      connection: 'close',
      'content-type': 'application/json',
    }),
    {
      'access-control-allow-origin': '*',
      'content-type': 'application/json',
    },
  )
})

test('origin allow list is optional', () => {
  const allowed = parseAllowedOrigins(
    ' https://a.example.com/, https://b.example.com ',
  )

  assert.deepEqual(allowed, ['https://a.example.com', 'https://b.example.com'])
  assert.equal(isOriginAllowed('https://evil.example.com', []), true)
  assert.equal(isOriginAllowed('https://a.example.com', allowed), true)
  assert.equal(isOriginAllowed('https://evil.example.com', allowed), false)
  assert.equal(isOriginAllowed(undefined, allowed), true)
})

test('upstream url must be https', () => {
  assert.equal(
    parseUpstreamUrl(' https://project.supabase.co ').host,
    'project.supabase.co',
  )
  assert.throws(() => parseUpstreamUrl(''), /required/)
  assert.throws(() => parseUpstreamUrl('http://project.supabase.co'), /https/)
})

test('requests are forwarded with method, path, headers and body', async () => {
  let received

  await withProxy(
    (req, res) => {
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => {
        received = {
          body: Buffer.concat(chunks).toString(),
          headers: req.headers,
          method: req.method,
          url: req.url,
        }
        res.writeHead(201, {
          'access-control-allow-origin': '*',
          'content-range': '0-0/1',
          'content-type': 'application/json',
        })
        res.end('[{"id":1}]')
      })
    },
    {},
    async (proxyUrl) => {
      const response = await fetch(`${proxyUrl}/rest/v1/items?select=id`, {
        body: '{"name":"a"}',
        headers: { apikey: 'key', 'content-type': 'application/json' },
        method: 'POST',
      })

      assert.equal(response.status, 201)
      assert.equal(response.headers.get('content-range'), '0-0/1')
      assert.equal(response.headers.get('access-control-allow-origin'), '*')
      assert.equal(await response.text(), '[{"id":1}]')
    },
  )

  assert.equal(received.method, 'POST')
  assert.equal(received.url, '/rest/v1/items?select=id')
  assert.equal(received.body, '{"name":"a"}')
  assert.equal(received.headers.apikey, 'key')
  assert.match(received.headers.host, /^127\.0\.0\.1:\d+$/)
})

test('disallowed paths and origins are rejected without calling upstream', async () => {
  let upstreamCalls = 0

  await withProxy(
    (_req, res) => {
      upstreamCalls += 1
      res.end()
    },
    { allowedOrigins: ['https://app.example.com'] },
    async (proxyUrl) => {
      const notFound = await fetch(`${proxyUrl}/pg/query`)
      assert.equal(notFound.status, 404)

      const forbidden = await fetch(`${proxyUrl}/rest/v1/items`, {
        headers: { origin: 'https://evil.example.com' },
      })
      assert.equal(forbidden.status, 403)

      const health = await fetch(`${proxyUrl}/healthz`)
      assert.equal(health.status, 200)
    },
  )

  assert.equal(upstreamCalls, 0)
})

test('upstream failures return 502', async () => {
  const proxy = http.createServer(
    createProxyHandler({
      agent: new http.Agent(),
      requestImpl: http.request,
      // 端口 1 上没有服务，连接会被拒绝
      upstreamUrl: new URL('http://127.0.0.1:1'),
    }),
  )
  const port = await listen(proxy)
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    const response = await fetch(`http://127.0.0.1:${port}/rest/v1/items`)
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), {
      message: 'Upstream request failed',
    })
  } finally {
    console.error = originalConsoleError
    await close(proxy)
  }
})
