import { describe, expect, it } from 'vitest'

import { resolveSyneyStoreReportProxyUrl } from './syneyStoreReportProxy'

describe('resolveSyneyStoreReportProxyUrl', () => {
  it('uses the local Vite proxy in development to avoid remote CORS blocks', () => {
    expect(
      resolveSyneyStoreReportProxyUrl({
        configuredProxyUrl: 'https://example.com/api/syney-store-report',
        isDev: true,
      }),
    ).toBe('/api/syney-store-report')
  })

  it('uses the configured proxy URL in production', () => {
    expect(
      resolveSyneyStoreReportProxyUrl({
        configuredProxyUrl: ' https://example.com/api/syney-store-report ',
        isDev: false,
      }),
    ).toBe('https://example.com/api/syney-store-report')
  })

  it('falls back to Supabase Edge Function when production has no proxy URL', () => {
    expect(
      resolveSyneyStoreReportProxyUrl({
        configuredProxyUrl: '',
        isDev: false,
      }),
    ).toBe('')
  })
})
