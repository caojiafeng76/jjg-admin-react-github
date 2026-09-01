import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

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

  it('stages the Aliyun FC proxy-security module with the server entrypoint', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'syney-store-report-fc-'))

    try {
      const packageResult = spawnSync(
        'bun',
        ['scripts/package-syney-store-report-fc.mjs', '--out', outputDir],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
        },
      )

      expect(
        packageResult.status,
        packageResult.stderr || packageResult.stdout,
      ).toBe(0)
      expect(existsSync(join(outputDir, 'server.js'))).toBe(true)
      expect(existsSync(join(outputDir, 'proxy-security.js'))).toBe(true)

      const smokeResult = spawnSync(
        'node',
        [
          '-e',
          "require('./proxy-security'); console.log('proxy-security resolved')",
        ],
        {
          cwd: outputDir,
          encoding: 'utf8',
        },
      )

      expect(smokeResult.status, smokeResult.stderr || smokeResult.stdout).toBe(
        0,
      )
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })
})
