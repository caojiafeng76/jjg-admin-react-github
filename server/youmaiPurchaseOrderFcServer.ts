/**
 * 阿里云函数计算（杭州）Web 函数入口：由国内节点代为访问优迈 SRM，避免境外链路登录超时。
 * 由 scripts/package-youmai-purchase-order-fc.mjs 打包为 dist/aliyun-fc/youmai-purchase-order/server.js。
 */
import http from 'node:http'

import { safeErrorMetadata } from '../api/proxySecurity'
import { createYoumaiPurchaseOrderHandler } from './youmaiPurchaseOrderHttp'

const PORT = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000)
const handleRequest = createYoumaiPurchaseOrderHandler(process.env)

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error: unknown) => {
    console.error('aliyun_unhandled_failure', safeErrorMetadata(error))
    if (!response.headersSent) {
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    response.end(JSON.stringify({ error: '优迈采购订单代理服务暂不可用' }))
  })
})

server.keepAliveTimeout = 0
server.headersTimeout = 0

server.listen(PORT, '0.0.0.0', () => {
  console.log(`youmai-purchase-order server listening on ${PORT}`)
})
