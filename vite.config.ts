import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

import { fileURLToPath, URL } from 'node:url'

import mkcert from 'vite-plugin-mkcert'
import { syneyStoreReportProxy } from './server/viteSyneyStoreReportProxy'
import { youmaiPurchaseOrderProxy } from './server/viteYoumaiPurchaseOrderProxy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      host: true, // 必须开启，以支持局域网访问
      https: {}, // 开启 HTTPS 模式
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@syney': fileURLToPath(
          new URL('./src/features/syney', import.meta.url),
        ),
        '@rc-component/util': fileURLToPath(
          new URL('./node_modules/@rc-component/util', import.meta.url),
        ),
      },
      dedupe: ['react', 'react-dom', '@rc-component/util'],
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    plugins: [
      react(),
      mkcert(),
      syneyStoreReportProxy(env),
      youmaiPurchaseOrderProxy(env),
      viteCompression({
        algorithm: 'gzip',
        threshold: 1024,
        deleteOriginFile: false,
      }),
    ],
    // Use Lightning CSS for minification to avoid noisy warnings from esbuild
    build: {
      cssMinify: 'lightningcss',
      manifest: true,
      // Excel workers and spreadsheet libraries are intentionally large and loaded on demand.
      chunkSizeWarningLimit: 900,
      // Vite 8 (Rolldown) 手动分包：manualChunks 已移除/弃用，改用 codeSplitting.groups。
      // 目标：核心 vendor 稳定 chunk（缓存友好）；重型组件（table/date-picker/select）
      // 与 PDF/XLSX 库不分组，保持按需懒加载拆分，避免首屏拉取整包 antd。
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              // React 生态核心：入口与所有页面共享
              {
                name: 'vendor-react',
                test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom|zustand|immer)[\\/]/,
                priority: 30,
              },
              // antd 基础组件（入口/绝大多数页面使用）
              {
                name: 'vendor-antd-core',
                test: /node_modules[\\/]antd[\\/]es[\\/](?:app|button|modal|form|input|message|notification|config-provider|typography|tabs|card|spin|space|tag|skeleton|empty|alert|result|popconfirm|dropdown|tooltip|badge|avatar|divider|flex|grid|checkbox|radio|switch|input-number|descriptions|progress|pagination|watermark|drawer|popover|list|statistic|wave|locale|version)[\\/]/,
                priority: 20,
              },
              // antd 体系依赖（icons、cssinjs、@rc-component、rc-*）
              {
                name: 'vendor-antd-deps',
                test: /node_modules[\\/](?:@ant-design|@rc-component|rc-)[\\/]/,
                priority: 15,
              },
              // 服务端状态与数据请求
              {
                name: 'vendor-query',
                test: /node_modules[\\/]@tanstack[\\/]/,
                priority: 15,
              },
              {
                name: 'vendor-supabase',
                test: /node_modules[\\/]@supabase[\\/]/,
                priority: 15,
              },
              // 日期库
              {
                name: 'vendor-dayjs',
                test: /node_modules[\\/]dayjs[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
  }
})
