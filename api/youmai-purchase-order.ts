import { fetchYoumaiPurchaseOrderFromServer } from '../youmaiPurchaseOrderServer'
import {
  authorizeProxyRequest,
  consumeDistributedProxyRateLimit,
  parseProxyIdentifier,
  readJsonObjectBody,
  resolveAllowedOrigin,
  safeErrorMetadata,
  validateContentLength,
} from './proxySecurity'

const REQUIRED_PERMISSION = 'page:youmai-finished-goods-stock-out'
const RATE_LIMIT_SCOPE = 'youmai-purchase-order' as const

type VercelRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
  on?: unknown
  socket?: { remoteAddress?: string }
}

type VercelResponse = {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => {
    end: () => void
    json: (body: Record<string, unknown>) => void
  }
}

function getHeader(request: VercelRequest, name: string): string | undefined {
  const entry = Object.entries(request.headers ?? {}).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )?.[1]
  return Array.isArray(entry) ? entry[0] : entry
}

function getRequestIp(request: VercelRequest): string {
  return (
    getHeader(request, 'x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(request, 'x-real-ip')?.trim() ||
    request.socket?.remoteAddress ||
    'unknown'
  )
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Vary', 'Origin')
  const requestOrigin = getHeader(request, 'origin')
  const allowedOrigin = resolveAllowedOrigin(
    requestOrigin,
    process.env.ALLOWED_ORIGIN,
  )
  if (allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader(
      'Access-Control-Allow-Headers',
      'authorization, content-type',
    )
  }

  if (request.method === 'OPTIONS') {
    response.status(allowedOrigin ? 204 : 403).end()
    return
  }

  if (requestOrigin && !allowedOrigin) {
    response.status(403).json({ error: 'Origin not allowed' })
    return
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const contentLength = validateContentLength(
    getHeader(request, 'content-length'),
  )
  if (contentLength !== 'ok') {
    response.status(contentLength === 'too-large' ? 413 : 400).json({
      error: contentLength === 'too-large' ? '请求体过大' : '请求体格式不正确',
    })
    return
  }

  const bodyResult = await readJsonObjectBody(request)
  if (!bodyResult.ok) {
    response.status(bodyResult.status).json({
      error: bodyResult.status === 413 ? '请求体过大' : '请求体格式不正确',
    })
    return
  }
  const body = bodyResult.body

  try {
    const access = await authorizeProxyRequest({
      authorization: getHeader(request, 'authorization'),
      diagnose: body.diagnose === true,
      permission: REQUIRED_PERMISSION,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
    })
    if (!access.ok) {
      response
        .status(access.status)
        .json({ error: access.status === 401 ? '未登录' : '无权访问' })
      return
    }

    if (
      !(await consumeDistributedProxyRateLimit({
        authorization: getHeader(request, 'authorization'),
        ip: getRequestIp(request),
        scope: RATE_LIMIT_SCOPE,
        supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: process.env.SUPABASE_URL,
      }))
    ) {
      response.status(429).json({ error: '请求过于频繁，请稍后重试' })
      return
    }

    const purchaseOrderNo = parseProxyIdentifier(body.purchaseOrderNo)

    if (!purchaseOrderNo) {
      response.status(400).json({ error: '请输入采购订单号' })
      return
    }

    const items = await fetchYoumaiPurchaseOrderFromServer(
      process.env,
      purchaseOrderNo,
    )

    response.status(200).json({
      purchaseOrderNo,
      total: items.length,
      items,
    })
  } catch (error) {
    console.error('youmai_proxy_failure', safeErrorMetadata(error))
    response.status(502).json({ error: '优迈采购订单代理服务暂不可用' })
  }
}
