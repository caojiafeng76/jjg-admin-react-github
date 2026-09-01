import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SYNEY_STORE_REPORT_PROXY_SOURCES = [
  'server/syneyStoreReportServer.ts',
  'supabase/functions/fetch-syney-store-report/index.ts',
  'aliyun-fc/syney-store-report/server.js',
] as const

function readBindFields(path: string): string[] {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  const match = source.match(/const BIND_FIELDS = \[([\s\S]*?)\]\.join\('\s*,\s*'\)/)

  expect(match?.[1]).toBeDefined()

  return Array.from(match?.[1].matchAll(/'([^']*)'/g) ?? [], ([, field]) => field)
}

describe('Syney store report SCM fields', () => {
  it.each(SYNEY_STORE_REPORT_PROXY_SOURCES)(
    'requests TaxUnitPrice from SCM BindGrid: %s',
    (path) => {
      expect(readBindFields(path)).toContain('TaxUnitPrice')
    },
  )
})
