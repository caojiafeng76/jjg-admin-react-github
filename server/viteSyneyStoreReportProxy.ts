import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

import {
  authorizeProxyRequest,
  consumeDistributedProxyRateLimit,
  parseJsonObjectBody,
  parseProxyIdentifier,
  resolveAllowedOrigin,
  safeErrorMetadata,
  validateContentLength,
} from './api/proxySecurity'
import { fetchSyneyStoreReportFromServer } from './syneyStoreReportServer'

type SyneyProxyEnv = Record<string, string>
const MAX_JSON_BODY_BYTES = 16 * 1024
const REQUIRED_PERMISSION = 'page:syney-store-report-list'
const RATE_LIMIT_SCOPE = 'syney-store-report' as const

class RequestBodyTooLargeError extends Error {}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function getRequestIp(request: IncomingMessage): string {
  return (
    getHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(request, 'x-real-ip')?.trim() ||
    request.socket.remoteAddress ||
    'unknown'
  )
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let byteLength = 0
    let rejected = false

    request.on('data', (chunk: Buffer | string) => {
      if (rejected) return
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
      if (!rejected) resolve(Buffer.concat(chunks).toString('utf8'))
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
  env: SyneyProxyEnv,
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

function configureMiddleware(server: ViteDevServer, env: SyneyProxyEnv) {
  server.middlewares.use(
    '/api/syney-store-report',
    async (request, response) => {
      const requestOrigin = getHeader(request, 'origin')
      const allowedOrigin = applyCors(request, response, env)
      if (request.method === 'OPTIONS') {
        response.statusCode = allowedOrigin ? 204 : 403
        response.end()
        return
      }
      if (requestOrigin && !allowedOrigin) {
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
          error:
            contentLength === 'too-large' ? '请求体过大' : '请求体格式不正确',
        })
        return
      }

      let requestBody: string
      try {
        requestBody = await readRequestBody(request)
      } catch (error) {
        if (error instanceof RequestBodyTooLargeError) {
          sendJson(response, 413, { error: '请求体过大' })
          return
        }
        console.error('vite_syney_body_failure', safeErrorMetadata(error))
        sendJson(response, 502, { error: '西尼入库单代理服务暂不可用' })
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
        const access = await authorizeProxyRequest({
          authorization: getHeader(request, 'authorization'),
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
            authorization: getHeader(request, 'authorization'),
            ip: getRequestIp(request),
            scope: RATE_LIMIT_SCOPE,
            supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY,
            supabaseUrl: env.SUPABASE_URL,
          }))
        ) {
          sendJson(response, 429, { error: '请求过于频繁，请稍后重试' })
          return
        }

        const storeInNo = parseProxyIdentifier(bodyResult.body.storeInNo)

        if (!storeInNo) {
          sendJson(response, 400, {
            error: '入库单号长度必须为 1 到 64 个字符',
          })
          return
        }

        const items = await fetchSyneyStoreReportFromServer(env, storeInNo)

        sendJson(response, 200, {
          storeInNo,
          total: Array.isArray(items) ? items.length : 0,
          items,
        })
      } catch (error) {
        console.error('vite_syney_proxy_failure', safeErrorMetadata(error))
        sendJson(response, 502, { error: '西尼入库单代理服务暂不可用' })
      }
    },
  )
}

export function syneyStoreReportProxy(env: SyneyProxyEnv): Plugin {
  return {
    name: 'syney-store-report-proxy',
    configureServer(server) {
      configureMiddleware(server, env)
    },
  }
}
