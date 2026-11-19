import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  diffSkillDirs,
  SKILLS_MIRROR_DIRS,
  SKILLS_SOURCE_DIR,
} from './sync-skills.mjs'

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
      readNumericSetting(config, /['"]?statements['"]?:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(12)
    expect(
      readNumericSetting(config, /['"]?branches['"]?:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(9)
    expect(
      readNumericSetting(config, /['"]?functions['"]?:\s*(\d+(?:\.\d+)?)/),
    ).toBeGreaterThanOrEqual(11)
    expect(
      readNumericSetting(config, /['"]?lines['"]?:\s*(\d+(?:\.\d+)?)/),
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

  it('lints and formats with @antfu/eslint-config instead of Prettier', () => {
    const config = readWorkspaceFile('eslint.config.js')
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      scripts: Record<string, string>
      devDependencies: Record<string, string>
    }

    expect(config).toMatch(/import antfu from ['"]@antfu\/eslint-config['"]/)
    expect(config).toMatch(/['"]node\/prefer-global\/process['"]:\s*['"]off['"]/)
    expect(packageJson.scripts.format).toBe('eslint . --fix')
    expect(packageJson.devDependencies).not.toHaveProperty('prettier')
    expect(existsSync(resolve(process.cwd(), '.prettierrc'))).toBe(false)
  })

  it('runs security, edge, bundle, and audit gates in CI', () => {
    const workflow = readWorkspaceFile('.github/workflows/ci.yml')

    expect(workflow).toMatch(/fetch-depth:\s*0/)
    expect(workflow).toMatch(/gitleaks\/gitleaks-action@/)
    expect(workflow).toMatch(/deno check supabase\/functions\/\*\/index\.ts/)
    expect(workflow).toMatch(/bun audit --production/)
    expect(workflow).toMatch(/bun run check:bundle/)
    expect(workflow).toMatch(/bun run changelog:check --github-event/)
  })

  it('keeps the six agents connected to the common rules', () => {
    const rootRules = readWorkspaceFile('AGENTS.md')
    expect(rootRules).toContain('CHANGELOG.MD')
    expect(rootRules).toContain('src/pages/dashboardChangelog.ts')

    expect(readWorkspaceFile('CLAUDE.md').trim()).toBe('@AGENTS.md')
    expect(readWorkspaceFile('GEMINI.md').trim()).toBe('@./AGENTS.md')
    expect(readWorkspaceFile('.github/copilot-instructions.md')).toMatch(/\]\(\.\.\/AGENTS\.md\)/)

    const cursor = readWorkspaceFile('.cursor/rules/development-workflow.mdc')
    const frontmatter = cursor.match(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/)?.[0]
    expect(frontmatter).toMatch(/^alwaysApply: true$/m)
    expect(cursor).toContain('@AGENTS.md')

    expect(existsSync(resolve(process.cwd(), 'opencode.jsonc'))).toBe(true)
  })

  it('resolves required project references in the main agent rules', () => {
    const references = {
      'AGENTS.md': [
        '.github/ai-task-matrix.md',
        '.github/instructions/project-feature-map.instructions.md',
        'docs/前端页面风格规范与设计指南.md',
        'docs/前端交互与反馈规范.md',
        'docs/Supabase数据库脚本执行说明.md',
      ],
      '.github/ai-task-matrix.md': ['../AGENTS.md'],
      '.claude/DEVELOPMENT_WORKFLOW.md': ['../AGENTS.md'],
    }

    for (const [file, targets] of Object.entries(references)) {
      const source = readWorkspaceFile(file)
      for (const target of targets) {
        expect(source, file).toContain(`](${target})`)
        expect(existsSync(resolve(process.cwd(), dirname(file), target)), target).toBe(true)
      }
    }
  })

  it('configures the existing Copilot database hook for the current runtime', () => {
    expect(JSON.parse(readWorkspaceFile('.github/hooks/db-destructive-guard.json'))).toMatchObject({
      version: 1,
      hooks: {
        PreToolUse: [{
          type: 'command',
          command: 'bun ./scripts/db-destructive-guard.mjs',
          timeoutSec: 10,
        }],
      },
    })
  })

  it.each([
    ['bun run db:query -- --file test.sql', false],
    ['bun run db:push:dry-run', false],
    ['supabase db push', true],
    ['psql', true],
  ])('checks Copilot database hook decisions for %s', (command, denied) => {
    const result = spawnSync(
      process.execPath,
      [resolve(process.cwd(), 'scripts/db-destructive-guard.mjs')],
      {
        encoding: 'utf8',
        input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_input: { command } }),
      },
    )

    expect(result.status, result.stderr).toBe(0)
    if (denied) {
      expect(JSON.parse(result.stdout)).toMatchObject({
        permissionDecision: 'deny',
        permissionDecisionReason: expect.any(String),
        hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny' },
      })
    }
    else {
      expect(result.stdout).toBe('')
    }
  })

  it('pins a patched DOMPurify and exposes the bundle budget command', () => {
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      scripts?: Record<string, string>
      overrides?: Record<string, string>
    }

    expect(packageJson.overrides?.dompurify).toBe('3.4.17')
    expect(packageJson.scripts?.['check:bundle']).toBe(
      'bun scripts/check-bundle-budget.mjs',
    )
  })

  it('keeps mirrored AI skill directories identical to .agents/skills', () => {
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      scripts?: Record<string, string>
    }
    expect(packageJson.scripts?.['skills:sync']).toBe(
      'bun scripts/sync-skills.mjs',
    )

    const sourceDir = resolve(process.cwd(), SKILLS_SOURCE_DIR)
    for (const mirror of SKILLS_MIRROR_DIRS) {
      // 不一致时执行 bun run skills:sync
      expect(
        diffSkillDirs(sourceDir, resolve(process.cwd(), mirror)),
        `${mirror} 与 ${SKILLS_SOURCE_DIR} 不一致，请执行 bun run skills:sync`,
      ).toEqual({ missing: [], extra: [], changed: [] })
    }
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
