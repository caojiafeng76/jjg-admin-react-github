import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

import { fetchSyneyStoreReportFromServer } from './syneyStoreReportServer'

type SyneyProxyEnv = Record<string, string>

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

function configureMiddleware(server: ViteDevServer, env: SyneyProxyEnv) {
  server.middlewares.use('/api/syney-store-report', async (request, response) => {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const requestBody = await readRequestBody(request)
      const payload = JSON.parse(requestBody) as { storeInNo?: string }
      const storeInNo = payload.storeInNo?.trim()

      if (!storeInNo) {
        sendJson(response, 400, { error: '请输入入库单号' })
        return
      }

      const items = await fetchSyneyStoreReportFromServer(env, storeInNo)

      sendJson(response, 200, {
        storeInNo,
        total: Array.isArray(items) ? items.length : 0,
        items,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '西尼入库单获取失败'
      sendJson(response, 500, { error: message })
    }
  })
}

export function syneyStoreReportProxy(env: SyneyProxyEnv): Plugin {
  return {
    name: 'syney-store-report-proxy',
    configureServer(server) {
      configureMiddleware(server, env)
    },
  }
}
