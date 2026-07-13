'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')

const {
  authorizeProxyRequest,
  consumeDistributedRateLimit,
  diagnosticErrorCategory,
  safeErrorMetadata,
} = require('./proxy-security')

const env = {
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_URL: 'https://project.supabase.co',
}

function createFetch(employee) {
  const calls = []
  const fetchImpl = async (input) => {
    calls.push(String(input))
    if (String(input).includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 })
    }
    if (String(input).includes('/rpc/current_user_has_permission')) {
      return new Response(JSON.stringify(true), { status: 200 })
    }
    return new Response(JSON.stringify([employee]), { status: 200 })
  }
  return { calls, fetchImpl }
}

test('allows diagnostics only for an active admin employee', async () => {
  const { calls, fetchImpl } = createFetch({ role: 'admin', is_active: true })
  const result = await authorizeProxyRequest({
    authorization: 'Bearer access-token',
    diagnose: true,
    env,
    fetchImpl,
    permission: 'page:syney-store-report-list',
  })

  assert.deepEqual(result, { ok: true, userId: 'user-1' })
  assert.equal(calls.length, 3)
  assert.match(calls[2], /\/rest\/v1\/employees\?/)
})

test('denies diagnostics to a non-admin employee', async () => {
  const { fetchImpl } = createFetch({ role: 'viewer', is_active: true })
  const result = await authorizeProxyRequest({
    authorization: 'Bearer access-token',
    diagnose: true,
    env,
    fetchImpl,
    permission: 'page:syney-store-report-list',
  })

  assert.deepEqual(result, { ok: false, status: 403 })
})

test('safe log metadata excludes message and body', () => {
  const error = Object.assign(new Error('sensitive upstream response'), {
    body: 'sensitive body',
    status: 503,
  })

  assert.deepEqual(safeErrorMetadata(error), { name: 'Error', status: 503 })
})

test('diagnostic errors expose only a stable category', () => {
  const error = new Error('sensitive upstream response')
  error.name = 'TimeoutError'

  assert.equal(diagnosticErrorCategory(error), 'timeout')
  assert.equal(
    diagnosticErrorCategory(new TypeError('private host')),
    'network',
  )
  assert.equal(diagnosticErrorCategory(error).includes(error.message), false)
})

test('uses the authenticated Supabase RPC for distributed rate limiting', async () => {
  const calls = []
  const fetchImpl = async (input, init) => {
    calls.push({ input: String(input), init })
    return new Response(JSON.stringify(true), { status: 200 })
  }

  const allowed = await consumeDistributedRateLimit({
    authorization: 'Bearer access-token',
    env,
    fetchImpl,
    ip: '192.0.2.12',
    scope: 'syney-store-report',
  })

  assert.equal(allowed, true)
  assert.equal(
    calls[0].input,
    `${env.SUPABASE_URL}/rest/v1/rpc/consume_proxy_rate_limit`,
  )
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    p_ip: '192.0.2.12',
    p_scope: 'syney-store-report',
  })
})
