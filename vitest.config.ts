import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const fullSourceCoverage = {
  all: true,
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.d.ts',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/**/*.vitest.{ts,tsx}',
    'src/test/**',
  ],
}

export default defineConfig({
  plugins: [react()],
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
      '@rc-component/util': fileURLToPath(
        new URL('./node_modules/@rc-component/util', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom', '@rc-component/util'],
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  test: {
    include: [
      'src/**/*.{test,spec,vitest}.{ts,tsx}',
      'scripts/**/*.vitest.{ts,tsx}',
    ],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      ...fullSourceCoverage,
      // Coverage gate only; it does not change application behavior.
      thresholds: {
        statements: 12,
        branches: 9,
        functions: 11,
        lines: 12,
        'src/services/**': { lines: 10 },
      },
    },
  },
})
