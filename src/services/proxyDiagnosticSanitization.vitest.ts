import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end, startIndex + start.length)
  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)
  return source.slice(startIndex, endIndex)
}

describe('proxy diagnostic response sanitization', () => {
  it.each([
    'supabase/functions/fetch-syney-store-report/index.ts',
    'supabase/functions/fetch-youmai-purchase-order/index.ts',
  ])(
    'keeps Edge diagnostic steps free of response bodies and messages: %s',
    (path) => {
      const diagnosticStep = sliceBetween(
        readSource(path),
        'async function runDiagnosticStep(',
        'async function diagnose',
      )

      expect(diagnosticStep).not.toMatch(/\b(?:bodyPreview|message|body)\s*:/)
      expect(diagnosticStep).not.toContain('.message')
      expect(diagnosticStep).not.toContain('.clone().text()')
      expect(diagnosticStep).toContain('errorCategory')
    },
  )

  it('keeps the Aliyun diagnostic response free of raw error details', () => {
    const diagnostic = sliceBetween(
      readSource('aliyun-fc/syney-store-report/server.js'),
      'async function diagnoseScmAccess()',
      'async function handleRequest',
    )

    expect(diagnostic).not.toMatch(/\b(?:bodyPreview|message|body|error)\s*:/)
    expect(diagnostic).not.toContain('.message')
    expect(diagnostic).not.toContain('String(error)')
    expect(diagnostic).toContain('errorCategory')
  })
})
