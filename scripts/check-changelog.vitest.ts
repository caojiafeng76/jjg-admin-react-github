import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = resolve('scripts/check-changelog.mjs')
const template = [
  '# 更新日志',
  '',
  '## 记录格式',
  '',
  '```markdown',
  '## 2099-01-01',
  '- **类别**：示例',
  '- **范围**：示例',
  '- **摘要**：示例',
  '- **验证**：示例',
  '```',
].join('\n')

function entry(summary: string, date = '2026-11-18'): string {
  return `## ${date}\n\n- **类别**：变更\n- **范围**：测试\n- **摘要**：${summary}\n- **验证**：Vitest\n`
}

const original = entry('基线记录')
let repository: string
let base: string

function git(...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', '-c', 'commit.gpgSign=false', ...args],
    { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim()
}

function write(path: string, contents: string): void {
  writeFileSync(join(repository, path), contents)
}

function changelog(...entries: string[]): void {
  write('CHANGELOG.MD', `${template}\n\n${entries.join('\n')}`)
}

function commit(): string {
  git('add', '--all')
  git('commit', '--quiet', '--no-verify', '-m', 'Fixture')
  return git('rev-parse', 'HEAD')
}

function check(...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repository,
    encoding: 'utf8',
  })
}

function githubEvent(name: string, event: object) {
  const path = join(repository, 'event.json')
  writeFileSync(path, JSON.stringify(event))
  return spawnSync(process.execPath, [script, '--github-event'], {
    cwd: repository,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: name, GITHUB_EVENT_PATH: path },
  })
}

describe('root changelog gate', () => {
  beforeEach(() => {
    repository = mkdtempSync(join(tmpdir(), 'jjg-changelog-'))
    git('init', '--quiet', '--initial-branch=main')
    changelog(original)
    base = commit()
  })

  afterEach(() => {
    rmSync(repository, { force: true, recursive: true })
  })

  it('fails when a repository change has no changelog update', () => {
    write('README.md', '新文档')
    const result = check('--base', base, '--head', commit())
    expect(result.status, result.stderr).toBe(1)
    expect(result.stderr).toContain('CHANGELOG.MD')
  })

  it.each(['replace', 'append', 'incomplete', 'template', 'reorder', 'delete'])(
    'rejects a %s change without a new complete entry above the old first entry',
    (change) => {
      write('README.md', '新文档')
      const fresh = entry('新增记录')

      switch (change) {
        case 'replace':
          changelog(fresh)
          break
        case 'append':
          changelog(original, fresh)
          break
        case 'incomplete':
          changelog(fresh.replace('Vitest', ''), original)
          break
        case 'template':
          write('CHANGELOG.MD', `${template.replace('示例', '新示例')}\n\n${original}`)
          break
        case 'reorder':
          changelog(entry('曾经的首条'), original)
          base = commit()
          write('README.md', '其他变更')
          changelog(original, entry('曾经的首条'))
          break
        case 'delete':
          rmSync(join(repository, 'CHANGELOG.MD'))
          break
      }

      const result = check('--base', base, '--head', commit())
      expect(result.status, result.stderr).toBe(1)
      expect(result.stderr).toContain('CHANGELOG.MD')
    },
  )

  it('accepts multiple prepended entries including a same-day entry', () => {
    write('README.md', '新文档')
    changelog(entry('新增记录'), entry('追加说明'), original)
    const result = check('--base', base, '--head', commit())
    expect(result.status, result.stderr).toBe(0)
  })

  it('accepts an empty diff and a changelog-only correction', () => {
    const unchanged = check('--base', base, '--head', base)
    expect(unchanged.status, unchanged.stderr).toBe(0)
    changelog(entry('修订用语'))
    const correction = check('--base', base, '--head', commit())
    expect(correction.status, correction.stderr).toBe(0)
  })

  it('checks the PR merge base rather than the advanced base branch', () => {
    git('checkout', '--quiet', '-b', 'feature')
    changelog(entry('PR 的修改'), original)
    write('README.md', 'PR 新文档')
    const head = commit()
    git('checkout', '--quiet', 'main')
    changelog(entry('另外一个 PR'), original)
    const advancedBase = commit()
    const result = githubEvent('pull_request', {
      pull_request: { base: { sha: advancedBase }, head: { sha: head } },
    })
    expect(result.status, result.stderr).toBe(0)
  })

  it('fails a push against its before commit when the update omits the changelog', () => {
    write('README.md', '新文档')
    const result = githubEvent('push', { before: base, after: commit() })
    expect(result.status, result.stderr).toBe(1)
    expect(result.stderr).toContain('CHANGELOG.MD')
  })

  it('handles an initial push and rejects an invalid commit ref', () => {
    const initial = githubEvent('push', { before: '0'.repeat(40), after: base, created: true })
    expect(initial.status, initial.stderr).toBe(0)
    const invalid = check('--base', 'missing-ref', '--head', base)
    expect(invalid.status, invalid.stderr).toBe(1)
    expect(invalid.stderr).toContain('missing-ref')
  })
})
