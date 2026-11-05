import type { IncomingMessage, ServerResponse } from 'node:http'
import type { YoumaiPurchaseOrderServerEnv } from './youmaiPurchaseOrderServer'

import {
  authorizeProxyRequest,
  consumeDistributedProxyRateLimit,
  isSameOriginRequest,
  parseJsonObjectBody,
  parseProxyIdentifier,
  resolveAllowedOrigin,
  safeErrorMetadata,
  validateContentLength,
} from '../api/proxySecurity'
import { YoumaiSrmUserError } from './youmaiPurchaseOrderErrors'
import { fetchYoumaiPurchaseOrderFromServer } from './youmaiPurchaseOrderServer'

const MAX_JSON_BODY_BYTES = 16 * 1024
const REQUIRED_PERMISSION = 'page:youmai-finished-goods-stock-out'
const RATE_LIMIT_SCOPE = 'youmai-purchase-order' as const
const UNAVAILABLE_MESSAGE = '优迈采购订单代理服务暂不可用'

class RequestBodyTooLargeError extends Error {}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function getRequestIp(request: IncomingMessage): string {
  return (
    getHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getHeader(request, 'x-real-ip')?.trim()
    || request.socket.remoteAddress
    || 'unknown'
  )
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let byteLength = 0
    let rejected = false

    request.on('data', (chunk: Buffer | string) => {
      if (rejected)
        return
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += buffer.byteLength
      if (byteLength > MAX_JSON_BODY_BYTES) {
        rejected = true
        reject(new RequestBodyTooLargeError())
        return
      }
      chunks.push(buffer)
    })
    request.on('end', () => {
      if (!rejected)
        resolve(Buffer.concat(chunks).toString('utf8'))
    })
    request.on('error', reject)
  })
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

function applyCors(
  request: IncomingMessage,
  response: ServerResponse,
  env: YoumaiPurchaseOrderServerEnv,
): string | null {
  response.setHeader('Vary', 'Origin')
  const allowedOrigin = resolveAllowedOrigin(
    getHeader(request, 'origin'),
    env.ALLOWED_ORIGIN,
  )
  if (allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader(
      'Access-Control-Allow-Headers',
      'authorization, content-type',
    )
  }
  return allowedOrigin
}

export interface YoumaiPurchaseOrderHandlerOptions {
  /**
   * 放行同源请求。仅 Vite 开发中间件开启：页面与代理同在 dev server，
   * 不必为本地地址配置 ALLOWED_ORIGIN。
   */
  allowSameOrigin?: boolean
}

/**
 * 「获取优迈采购订单」代理的 Node HTTP 处理函数，Vite 开发中间件与阿里云 FC 共用。
 * 请求体：`{ purchaseOrderNo }`；响应：`{ purchaseOrderNo, total, items }`。
 */
export function createYoumaiPurchaseOrderHandler(
  env: YoumaiPurchaseOrderServerEnv,
  { allowSameOrigin = false }: YoumaiPurchaseOrderHandlerOptions = {},
) {
  return async function handleYoumaiPurchaseOrderRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ) {
    const requestOrigin = getHeader(request, 'origin')
    const allowedOrigin = applyCors(request, response, env)
    // Vite 以 HTTPS 运行时走 HTTP/2，请求没有 Host 头，地址在 :authority 伪头里
    const requestHost = getHeader(request, 'host') || getHeader(request, ':authority')
    const sameOrigin
      = allowSameOrigin && isSameOriginRequest(requestOrigin, requestHost)
    if (request.method === 'OPTIONS') {
      response.statusCode = allowedOrigin ? 204 : 403
      response.end()
      return
    }
    if (requestOrigin && !allowedOrigin && !sameOrigin) {
      sendJson(response, 403, { error: 'Origin not allowed' })
      return
    }
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    const contentLength = validateContentLength(
      getHeader(request, 'content-length'),
    )
    if (contentLength !== 'ok') {
      sendJson(response, contentLength === 'too-large' ? 413 : 400, {
        error: contentLength === 'too-large' ? '请求体过大' : '请求体格式不正确',
      })
      return
    }

    let requestBody: string
    try {
      requestBody = await readRequestBody(request)
    }
    catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        sendJson(response, 413, { error: '请求体过大' })
        return
      }
      console.error('youmai_proxy_body_failure', safeErrorMetadata(error))
      sendJson(response, 502, { error: UNAVAILABLE_MESSAGE })
      return
    }

    const bodyResult = parseJsonObjectBody(requestBody)
    if (!bodyResult.ok) {
      sendJson(response, bodyResult.status, {
        error: bodyResult.status === 413 ? '请求体过大' : '请求体格式不正确',
      })
      return
    }

    try {
      const authorization = getHeader(request, 'authorization')
      const access = await authorizeProxyRequest({
        authorization,
        permission: REQUIRED_PERMISSION,
        supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY,
        supabaseUrl: env.SUPABASE_URL,
      })
      if (!access.ok) {
        sendJson(response, access.status, {
          error: access.status === 401 ? '未登录' : '无权访问',
        })
        return
      }
      if (
        !(await consumeDistributedProxyRateLimit({
          authorization,
          ip: getRequestIp(request),
          scope: RATE_LIMIT_SCOPE,
          supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY,
          supabaseUrl: env.SUPABASE_URL,
        }))
      ) {
        sendJson(response, 429, { error: '请求过于频繁，请稍后重试' })
        return
      }

      const purchaseOrderNo = parseProxyIdentifier(
        bodyResult.body.purchaseOrderNo,
      )
      if (!purchaseOrderNo) {
        sendJson(response, 400, {
          error: '采购订单号长度必须为 1 到 64 个字符',
        })
        return
      }

      const items = await fetchYoumaiPurchaseOrderFromServer(
        env,
        purchaseOrderNo,
      )

      sendJson(response, 200, {
        purchaseOrderNo,
        total: items.length,
        items,
      })
    }
    catch (error) {
      if (error instanceof YoumaiSrmUserError) {
        sendJson(response, 422, { error: error.message })
        return
      }
      console.error('youmai_proxy_failure', safeErrorMetadata(error))
      sendJson(response, 502, { error: UNAVAILABLE_MESSAGE })
    }
  }
}
