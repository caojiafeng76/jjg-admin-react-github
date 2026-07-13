'use strict'

function extractBearerToken(authorization) {
  return String(authorization || '').match(/^Bearer\s+([^\s]+)$/i)?.[1] || null
}

async function authorizeProxyRequest({
  authorization,
  diagnose,
  env,
  fetchImpl = fetch,
  permission,
}) {
  const token = extractBearerToken(authorization)
  if (!token) return { ok: false, status: 401 }

  const supabaseUrl = String(env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '')
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase proxy authentication is not configured')
  }

  const headers = {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
  }
  const userResponse = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    headers,
  })
  if (!userResponse.ok) return { ok: false, status: 401 }

  const user = await userResponse.json()
  if (!user || typeof user.id !== 'string' || !user.id) {
    return { ok: false, status: 401 }
  }

  async function hasPermission(permissionKey) {
    const response = await fetchImpl(
      `${supabaseUrl}/rest/v1/rpc/current_user_has_permission`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_key: permissionKey }),
      },
    )
    if (!response.ok) throw new Error('Supabase permission check failed')
    return (await response.json()) === true
  }

  if (!(await hasPermission(permission))) return { ok: false, status: 403 }
  if (diagnose) {
    const employeeResponse = await fetchImpl(
      `${supabaseUrl}/rest/v1/employees?select=role%2Cis_active&auth_user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers },
    )
    if (!employeeResponse.ok) throw new Error('Supabase admin check failed')
    const employees = await employeeResponse.json()
    const employee = Array.isArray(employees) ? employees[0] : undefined
    if (employee?.role !== 'admin' || employee.is_active !== true) {
      return { ok: false, status: 403 }
    }
  }

  return { ok: true, userId: user.id }
}

async function consumeDistributedRateLimit({
  authorization,
  env,
  fetchImpl = fetch,
  ip,
  scope,
}) {
  const token = extractBearerToken(authorization)
  const supabaseUrl = String(env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '')
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!token || !supabaseUrl || !publishableKey) {
    throw new Error('Supabase proxy rate limiting is not configured')
  }

  const response = await fetchImpl(
    `${supabaseUrl}/rest/v1/rpc/consume_proxy_rate_limit`,
    {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_ip: String(ip || 'unknown').trim().slice(0, 255) || 'unknown',
        p_scope: scope,
      }),
    },
  )
  if (!response.ok) throw new Error('Supabase rate limit check failed')
  return (await response.json()) === true
}

function parseProxyIdentifier(value) {
  if (typeof value !== 'string') return null
  const identifier = value.trim()
  return identifier.length >= 1 && identifier.length <= 64 ? identifier : null
}

function resolveAllowedOrigin(requestOrigin, configuredOrigins) {
  if (!requestOrigin || !configuredOrigins) return null
  const origins = String(configuredOrigins)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*')
  return origins.includes(requestOrigin) ? requestOrigin : null
}

function safeErrorMetadata(error) {
  const candidateName =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : 'UnknownError'
  const name = /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(candidateName)
    ? candidateName
    : 'UnknownError'
  const candidateStatus =
    error && typeof error === 'object' && 'status' in error
      ? Number(error.status)
      : undefined

  return Number.isInteger(candidateStatus) &&
    candidateStatus >= 100 &&
    candidateStatus <= 599
    ? { name, status: candidateStatus }
    : { name }
}

function diagnosticErrorCategory(error) {
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout'
  if (name === 'TypeError') return 'network'
  return 'request_failed'
}

module.exports = {
  authorizeProxyRequest,
  consumeDistributedRateLimit,
  diagnosticErrorCategory,
  extractBearerToken,
  parseProxyIdentifier,
  resolveAllowedOrigin,
  safeErrorMetadata,
}
