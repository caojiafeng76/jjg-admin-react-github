import type { Plugin } from 'vite'

import { appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SYNEY_DELIVERY_ORDER_DEV_PROXY_URL } from '../src/services/syneyDeliveryOrderContract'
import { createSyneyDeliveryOrderHandler } from './syneyDeliveryOrderHttp'
import { setScmTrace } from './syneyScmClient'

/** 开发环境 SCM 请求跟踪日志（不含密码与 cookie 值），排查 SCM 返回空内容等问题时查看 */
export const SYNEY_SCM_TRACE_FILE = join(tmpdir(), 'syney-scm-trace.log')

/**
 * 本地 .env 通常只配置了前端用的 VITE_REACT_APP_SUPABASE_*，
 * 未单独配置 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 时沿用前端的地址（优先代理）和公开 key，
 * 与浏览器访问的是同一个 Supabase 项目。
 */
export function resolveDevProxyEnv(env: Record<string, string>): Record<string, string> {
  return {
    ...env,
    SUPABASE_URL:
      env.SUPABASE_URL?.trim()
      || env.VITE_REACT_APP_SUPABASE_PROXY_URL?.trim()
      || env.VITE_REACT_APP_SUPABASE_URL?.trim()
      || '',
    SUPABASE_PUBLISHABLE_KEY:
      env.SUPABASE_PUBLISHABLE_KEY?.trim()
      || env.VITE_REACT_APP_SUPABASE_KEY?.trim()
      || '',
  }
}

/** 开发环境的「生成送货单」代理：本机在国内，可直接访问西尼 SCM */
export function syneyDeliveryOrderProxy(env: Record<string, string>): Plugin {
  return {
    name: 'syney-delivery-order-proxy',
    configureServer(server) {
      // 排查 SCM 问题时在 .env 设置 SYNEY_SCM_TRACE=1，请求记录写入系统临时目录
      if (env.SYNEY_SCM_TRACE === '1') {
        setScmTrace((entry) => {
          appendFileSync(SYNEY_SCM_TRACE_FILE, `${JSON.stringify(entry)}\n`)
        })
      }
      server.middlewares.use(
        SYNEY_DELIVERY_ORDER_DEV_PROXY_URL,
        createSyneyDeliveryOrderHandler(resolveDevProxyEnv(env), {
          allowSameOrigin: true,
        }),
      )
    },
  }
}
