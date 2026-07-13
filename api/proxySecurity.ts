export const MAX_JSON_BODY_BYTES = 16 * 1024

export type ProxyRateLimitScope = 'syney-store-report' | 'youmai-purchase-order'

type AuthorizeProxyRequestOptions = {
  authorization: string | undefined
  diagnose?: boolean
  fetchImpl?: typeof fetch
  permission: string
  supabasePublishableKey: string | undefined
  supabaseUrl: string | undefined
}

export type ProxyAuthorizationResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 }

function extractBearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] ?? null
}

export async function authorizeProxyRequest({
  authorization,
  diagnose = false,
  fetchImpl = fetch,
  permission,
  supabasePublishableKey,
  supabaseUrl,
}: AuthorizeProxyRequestOptions): Promise<ProxyAuthorizationResult> {
  const token = extractBearerToken(authorization)
  if (!token) {
    return { ok: false, status: 401 }
  }

  const url = supabaseUrl?.trim().replace(/\/$/, '')
  const publishableKey = supabasePublishableKey?.trim()
  if (!url || !publishableKey) {
    throw new Error('Supabase proxy authentication is not configured')
  }

  const headers = {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
  }
  const userResponse = await fetchImpl(`${url}/auth/v1/user`, { headers })
  if (!userResponse.ok) {
    return { ok: false, status: 401 }
  }

  const user = (await userResponse.json()) as { id?: unknown }
  if (typeof user.id !== 'string' || !user.id) {
    return { ok: false, status: 401 }
  }

  const permissionResponse = await fetchImpl(
    `${url}/rest/v1/rpc/current_user_has_permission`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key: permission }),
    },
  )
  if (!permissionResponse.ok) {
    throw new Error('Supabase permission check failed')
  }

  const allowed = (await permissionResponse.json()) === true
  if (!allowed) {
    return { ok: false, status: 403 }
  }

  if (diagnose) {
    const employeeResponse = await fetchImpl(
      `${url}/rest/v1/employees?select=role%2Cis_active&auth_user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers },
    )
    if (!employeeResponse.ok) {
      throw new Error('Supabase admin check failed')
    }
    const employees = (await employeeResponse.json()) as Array<{
      is_active?: unknown
      role?: unknown
    }>
    const employee = Array.isArray(employees) ? employees[0] : undefined
    if (employee?.role !== 'admin' || employee.is_active !== true) {
      return { ok: false, status: 403 }
    }
  }

  return { ok: true, userId: user.id }
}

type DistributedProxyRateLimitOptions = {
  authorization: string | undefined
  fetchImpl?: typeof fetch
  ip: string | undefined
  scope: ProxyRateLimitScope
  supabasePublishableKey: string | undefined
  supabaseUrl: string | undefined
}

export async function consumeDistributedProxyRateLimit({
  authorization,
  fetchImpl = fetch,
  ip,
  scope,
  supabasePublishableKey,
  supabaseUrl,
}: DistributedProxyRateLimitOptions): Promise<boolean> {
  const token = extractBearerToken(authorization)
  const url = supabaseUrl?.trim().replace(/\/$/, '')
  const publishableKey = supabasePublishableKey?.trim()
  if (!token || !url || !publishableKey) {
    throw new Error('Supabase proxy rate limiting is not configured')
  }

  const response = await fetchImpl(
    `${url}/rest/v1/rpc/consume_proxy_rate_limit`,
    {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_ip: ip?.trim().slice(0, 255) || 'unknown',
        p_scope: scope,
      }),
    },
  )
  if (!response.ok) {
    throw new Error('Supabase rate limit check failed')
  }

  return (await response.json()) === true
}

export type ContentLengthValidation = 'ok' | 'invalid' | 'too-large'

export function validateContentLength(
  contentLength: string | undefined,
): ContentLengthValidation {
  if (contentLength === undefined) return 'ok'

  const value = Number(contentLength)
  if (!Number.isInteger(value) || value < 0) return 'invalid'
  return value <= MAX_JSON_BODY_BYTES ? 'ok' : 'too-large'
}

export type JsonObjectBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413 }

export function parseJsonObjectBody(body: unknown): JsonObjectBodyResult {
  if (!isJsonBodyWithinLimit(body)) {
    return { ok: false, status: 413 }
  }

  let parsed = body
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body) as unknown
    } catch {
      return { ok: false, status: 400 }
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, status: 400 }
  }

  return { ok: true, body: parsed as Record<string, unknown> }
}

type JsonBodyRequest = {
  body?: unknown
  on?: unknown
}

function toRawBodyBuffer(chunk: unknown): Buffer | null {
  if (typeof chunk === 'string') {
    return Buffer.from(chunk)
  }
  if (Buffer.isBuffer(chunk)) {
    return chunk
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  }
  return null
}

export async function readJsonObjectBody(
  request: JsonBodyRequest,
): Promise<JsonObjectBodyResult> {
  if (typeof request.on !== 'function') {
    return parseJsonObjectBody(request.body)
  }

  const stream = request as JsonBodyRequest & {
    on: (event: string, listener: (value?: unknown) => void) => unknown
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let byteLength = 0
    let settled = false

    const finish = (result: JsonObjectBodyResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    stream.on('data', (chunk) => {
      if (settled) return

      const buffer = toRawBodyBuffer(chunk)
      if (!buffer) {
        finish({ ok: false, status: 400 })
        return
      }

      byteLength += buffer.byteLength
      if (byteLength > MAX_JSON_BODY_BYTES) {
        finish({ ok: false, status: 413 })
        return
      }
      chunks.push(buffer)
    })
    stream.on('end', () => {
      if (settled) return
      finish(
        parseJsonObjectBody(Buffer.concat(chunks, byteLength).toString('utf8')),
      )
    })
    stream.on('error', () => finish({ ok: false, status: 400 }))
  })
}

export function safeErrorMetadata(error: unknown): {
  name: string
  status?: number
} {
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
    candidateStatus !== undefined &&
    candidateStatus >= 100 &&
    candidateStatus <= 599
    ? { name, status: candidateStatus }
    : { name }
}

export function isJsonBodyWithinLimit(body: unknown): boolean {
  try {
    const serialized = typeof body === 'string' ? body : JSON.stringify(body)
    return (
      new TextEncoder().encode(serialized ?? '').byteLength <=
      MAX_JSON_BODY_BYTES
    )
  } catch {
    return false
  }
}

export function parseProxyIdentifier(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const identifier = value.trim()
  return identifier.length >= 1 && identifier.length <= 64 ? identifier : null
}

export function resolveAllowedOrigin(
  requestOrigin: string | undefined,
  configuredOrigins: string | undefined,
): string | null {
  if (!requestOrigin || !configuredOrigins) {
    return null
  }

  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*')
  return origins.includes(requestOrigin) ? requestOrigin : null
}
