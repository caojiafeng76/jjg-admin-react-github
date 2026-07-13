import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_JSON_BODY_BYTES = 16 * 1024

export type EdgeProxyRateLimitScope =
  | 'syney-store-report'
  | 'youmai-purchase-order'

export type EdgeProxyAuthorizationResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 }

export function hasBearerAuthorization(request: Request): boolean {
  return /^Bearer\s+[^\s]+$/i.test(request.headers.get('Authorization') ?? '')
}

export function getProxyCorsHeaders(request: Request): Record<string, string> {
  const requestOrigin = request.headers.get('Origin') ?? ''
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGIN') ?? '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin && origin !== '*')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-region',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'x-sb-edge-region',
    Vary: 'Origin',
  }

  if (allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin
  }

  return headers
}

export function isProxyOriginAllowed(request: Request): boolean {
  return (
    !request.headers.has('Origin') ||
    Boolean(getProxyCorsHeaders(request)['Access-Control-Allow-Origin'])
  )
}

export async function readLimitedJsonBody<T>(
  request: Request,
): Promise<{ ok: true; payload: T } | { ok: false; status: 400 | 413 }> {
  const declaredLength = Number(request.headers.get('Content-Length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    return { ok: false, status: 413 }
  }

  if (!request.body) {
    return { ok: false, status: 400 }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > MAX_JSON_BODY_BYTES) {
      await reader.cancel()
      return { ok: false, status: 413 }
    }
    chunks.push(value)
  }

  const body = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(body)) as unknown
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, status: 400 }
    }
    return {
      ok: true,
      payload: payload as T,
    }
  } catch {
    return { ok: false, status: 400 }
  }
}

export async function authorizeEdgeProxyRequest(
  request: Request,
  permission: string,
  diagnose: boolean,
): Promise<EdgeProxyAuthorizationResult> {
  const authorization = request.headers.get('Authorization') ?? ''
  const token = authorization.match(/^Bearer\s+([^\s]+)$/i)?.[1]
  if (!token) {
    return { ok: false, status: 401 }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')?.trim() ||
    Deno.env.get('SUPABASE_ANON_KEY')?.trim()
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase Edge authentication is not configured')
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return { ok: false, status: 401 }
  }

  const hasPermission = async (permissionKey: string) => {
    const { data, error } = await supabase.rpc('current_user_has_permission', {
      p_key: permissionKey,
    })
    if (error) {
      throw new Error('Supabase Edge permission check failed')
    }
    return data === true
  }

  if (!(await hasPermission(permission))) {
    return { ok: false, status: 403 }
  }
  if (diagnose) {
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('role,is_active')
      .eq('auth_user_id', user.id)
      .limit(1)
    if (employeeError) {
      throw new Error('Supabase Edge admin check failed')
    }
    const employee = employees?.[0]
    if (employee?.role !== 'admin' || employee.is_active !== true) {
      return { ok: false, status: 403 }
    }
  }

  return { ok: true, userId: user.id }
}

export async function consumeEdgeProxyRateLimit(
  request: Request,
  scope: EdgeProxyRateLimitScope,
): Promise<boolean> {
  const authorization = request.headers.get('Authorization') ?? ''
  const token = authorization.match(/^Bearer\s+([^\s]+)$/i)?.[1]
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim().replace(/\/$/, '')
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')?.trim() ||
    Deno.env.get('SUPABASE_ANON_KEY')?.trim()
  if (!token || !supabaseUrl || !publishableKey) {
    throw new Error('Supabase Edge rate limiting is not configured')
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/consume_proxy_rate_limit`,
    {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_ip: ip.slice(0, 255),
        p_scope: scope,
      }),
    },
  )
  if (!response.ok) {
    throw new Error('Supabase Edge rate limit check failed')
  }

  return (await response.json()) === true
}

export function parseProxyIdentifier(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const identifier = value.trim()
  return identifier.length >= 1 && identifier.length <= 64 ? identifier : null
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

export function diagnosticErrorCategory(
  error: unknown,
): 'network' | 'request_failed' | 'timeout' {
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout'
  if (name === 'TypeError') return 'network'
  return 'request_failed'
}
