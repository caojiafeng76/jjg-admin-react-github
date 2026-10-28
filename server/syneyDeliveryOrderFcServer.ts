/**
 * 阿里云函数计算（杭州）Web 函数入口：西尼 SCM 只接受中国 IP，生产环境由它做跳板。
 * 由 scripts/package-syney-delivery-order-fc.mjs 打包为 dist/aliyun-fc/syney-delivery-order/server.js。
 */
import http from 'node:http'

import { safeErrorMetadata } from '../api/proxySecurity'
import { createSyneyDeliveryOrderHandler } from './syneyDeliveryOrderHttp'

const PORT = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000)
const handleRequest = createSyneyDeliveryOrderHandler(process.env)

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error: unknown) => {
    console.error('aliyun_unhandled_failure', safeErrorMetadata(error))
    if (!response.headersSent) {
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    response.end(JSON.stringify({ error: '西尼送货单代理服务暂不可用' }))
  })
})

server.keepAliveTimeout = 0
server.headersTimeout = 0

server.listen(PORT, '0.0.0.0', () => {
  console.log(`syney-delivery-order server listening on ${PORT}`)
})
