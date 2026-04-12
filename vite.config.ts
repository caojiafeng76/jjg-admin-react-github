import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { fileURLToPath, URL } from 'node:url'

import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
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
      '@syney': fileURLToPath(new URL('./src/features/syney', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [react(), mkcert()],
  // Use Lightning CSS for minification to avoid noisy warnings from esbuild
  build: {
    cssMinify: 'lightningcss',
    // Excel workers and spreadsheet libraries are intentionally large and loaded on demand.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('xlsx-js-style')) {
            return 'vendor-xlsx-style'
          }

          if (/[\\/]node_modules[\\/]xlsx[\\/]/.test(id)) {
            return 'vendor-xlsx'
          }

          if (
            id.includes('jspdf') ||
            id.includes('jspdf-autotable') ||
            id.includes('html2canvas')
          ) {
            return 'vendor-pdf'
          }

          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            /[\\/]node_modules[\\/]react[\\/]/.test(id)
          ) {
            return 'vendor-react'
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }

          return undefined
        },
      },
    },
  },
})
