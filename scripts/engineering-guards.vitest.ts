import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function readNumericSetting(source: string, pattern: RegExp): number {
  const match = source.match(pattern)
  if (!match?.[1]) {
    throw new Error(`Missing numeric setting for ${pattern}`)
  }
  return Number(match[1])
}

describe('P3 engineering guards', () => {
  it('raises global and service coverage floors without changing global timeout', () => {
    const config = readWorkspaceFile('vitest.config.ts')

    expect(
      readNumericSetting(config, /statements:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(12)
    expect(
      readNumericSetting(config, /branches:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(9)
    expect(
      readNumericSetting(config, /functions:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(11)
    expect(
      readNumericSetting(config, /lines:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(12)
    expect(
      readNumericSetting(
        config,
        /['"]src\/services\/\*\*['"]:\s*\{\s*lines:\s*(\d+(?:\.\d+)?)/,
      ),
    ).toBeGreaterThanOrEqual(10)
    expect(config).not.toMatch(/testTimeout\s*:/)
  })

  it('gives only the slow extrusion form suite a 20 second timeout', () => {
    const testSource = readWorkspaceFile(
      'src/features/extrusion-production/ExtrusionProductionForm.test.tsx',
    )

    expect(testSource).toMatch(
      /describe\(\s*['"]ExtrusionProductionForm['"],\s*\{\s*timeout:\s*20_000\s*\}/,
    )
  })

  it('lints JavaScript tooling files with Node globals', () => {
    const config = readWorkspaceFile('eslint.config.js')

    expect(config).toMatch(/files:\s*\[['"]\*\*\/\*\.\{js,mjs,cjs\}['"]\]/)
    expect(config).toMatch(/globals:\s*globals\.node/)
  })

  it('runs security, edge, bundle, and audit gates in CI', () => {
    const workflow = readWorkspaceFile('.github/workflows/ci.yml')

    expect(workflow).toMatch(/fetch-depth:\s*0/)
    expect(workflow).toMatch(/gitleaks\/gitleaks-action@/)
    expect(workflow).toMatch(/deno check supabase\/functions\/\*\/index\.ts/)
    expect(workflow).toMatch(/bun audit --production/)
    expect(workflow).toMatch(/bun run check:bundle/)
  })

  it('pins a patched DOMPurify and exposes the bundle budget command', () => {
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      scripts?: Record<string, string>
      overrides?: Record<string, string>
    }

    expect(packageJson.overrides?.dompurify).toBe('3.4.12')
    expect(packageJson.scripts?.['check:bundle']).toBe(
      'bun scripts/check-bundle-budget.mjs',
    )
  })

  it('keeps a single generated Supabase database type source', () => {
    expect(
      existsSync(resolve(process.cwd(), 'src/services/database.types.ts')),
    ).toBe(true)
    expect(
      existsSync(resolve(process.cwd(), 'src/types/database.types.ts')),
    ).toBe(false)
  })
})
