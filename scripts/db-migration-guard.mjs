import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseMigrationPreview } from './db-sql-guard.mjs'

function snapshot(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => [
      name,
      createHash('sha256')
        .update(readFileSync(resolve(directory, name)))
        .digest('hex'),
    ])
}

export function snapshotMigrationFiles(workdir) {
  return JSON.stringify(snapshot(resolve(workdir, 'supabase/migrations')))
}

export function captureMigrationPlan(preview, workdir, beforePreview) {
  const names = parseMigrationPreview(preview)
  const directory = resolve(workdir, 'supabase/migrations')
  const before = JSON.stringify(snapshot(directory))
  if (beforePreview !== undefined && beforePreview !== before)
    throw new Error('迁移文件在预演期间发生变化，已停止执行。')
  const sql = names
    .map(
      (name) =>
        `-- Migration: ${name}\n${readFileSync(resolve(directory, name), 'utf8')}`,
    )
    .join('\n')
  return {
    sql,
    assertUnchanged() {
      if (before !== JSON.stringify(snapshot(directory)))
        throw new Error('迁移文件在预演或确认期间发生变化，已停止执行。')
    },
  }
}
