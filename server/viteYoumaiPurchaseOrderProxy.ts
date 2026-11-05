import type { Plugin } from 'vite'

import { resolveDevProxyEnv } from './viteSyneyDeliveryOrderProxy'
import { createYoumaiPurchaseOrderHandler } from './youmaiPurchaseOrderHttp'

/** 开发环境的「获取优迈采购订单」代理：由本机直接访问优迈 SRM */
export function youmaiPurchaseOrderProxy(env: Record<string, string>): Plugin {
  return {
    name: 'youmai-purchase-order-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/youmai-purchase-order',
        createYoumaiPurchaseOrderHandler(resolveDevProxyEnv(env), {
          allowSameOrigin: true,
        }),
      )
    },
  }
}
