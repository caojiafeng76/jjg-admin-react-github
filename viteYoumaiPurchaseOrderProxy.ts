import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

import { fetchYoumaiPurchaseOrderFromServer } from './youmaiPurchaseOrderServer'

type YoumaiProxyEnv = Record<string, string>

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''

    request.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8')
    })
    request.on('end', () => resolve(body))
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

function configureMiddleware(server: ViteDevServer, env: YoumaiProxyEnv) {
  server.middlewares.use(
    '/api/youmai-purchase-order',
    async (request, response) => {
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }

      try {
        const requestBody = await readRequestBody(request)
        const payload = JSON.parse(requestBody) as { purchaseOrderNo?: string }
        const purchaseOrderNo = payload.purchaseOrderNo?.trim()

        if (!purchaseOrderNo) {
          sendJson(response, 400, { error: '请输入采购订单号' })
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '优迈采购订单获取失败'
        sendJson(response, 500, { error: message })
      }
    },
  )
}

export function youmaiPurchaseOrderProxy(env: YoumaiProxyEnv): Plugin {
  return {
    name: 'youmai-purchase-order-proxy',
    configureServer(server) {
      configureMiddleware(server, env)
    },
  }
}
