/**
 * API-based migration push — 通过 Supabase Management API (db query) 推送 migration，
 * 完全绕过直连 Postgres TCP，适用于 Cloudflare WARP / 代理环境导致 db push 直连失败的场景。
 *
 * 匹配逻辑：同时按 version 和 name 判断是否已应用，
 * 本地文件 version 或 name 已存在于远程历史中的，视为已应用，跳过。
 *
 * 用法:
 *   bun run db:push:api
 *   bun run db:push:api -- --dry-run
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'supabase', 'migrations')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法:
  bun run db:push:api
  bun run db:push:api -- --dry-run

说明:
  通过 Supabase Management API (db query --linked) 逐个应用未推送的 migration。
  完全绕过直连 Postgres TCP 连接，适用于 WARP / 代理环境导致 db push 直连失败的场景。
  不依赖 Docker、不需要 SUPABASE_DB_URL、不需要数据库密码。
  同时按 version 和 name 匹配已应用记录，避免重复推送。`)
  process.exit(0)
}

// ── helpers ──────────────────────────────────────────────────────────

function dbQuery(sql) {
  const result = spawnSync(
    process.execPath,
    ['x', 'supabase', 'db', 'query', '--linked', sql],
    { encoding: 'utf8', stdio: 'pipe' },
  )
  if (result.error) {
    throw new Error(`db query 执行出错: ${result.error.message}`)
  }
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  }
}

function dbQueryFile(filePath) {
  const result = spawnSync(
    process.execPath,
    ['x', 'supabase', 'db', 'query', '--linked', '--file', filePath],
    { encoding: 'utf8', stdio: 'pipe' },
  )
  if (result.error) {
    throw new Error(`db query --file 执行出错: ${result.error.message}`)
  }
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  }
}

function parseMigrationFilename(filename) {
  const match = filename.match(/^(\d+)_(.+)\.sql$/)
  if (!match) return null
  return { version: match[1], name: match[2], filename }
}

function escapeSQL(str) {
  return str.replace(/'/g, "''")
}

function parseTableOutput(stdout, columns) {
  // 解析 CLI 表格输出：│ value1 │ value2 │
  const rows = []
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('│')) continue
    // 去掉首尾 │ 然后按 │ 分割
    const cells = trimmed
      .replace(/^│/, '')
      .replace(/│$/, '')
      .split('│')
      .map((c) => c.trim())
    // 跳过表头行
    if (cells.length >= columns.length && cells[0] !== columns[0]) {
      const row = {}
      columns.forEach((col, i) => {
        row[col] = cells[i] ?? ''
      })
      rows.push(row)
    }
  }
  return rows
}

// ── main ─────────────────────────────────────────────────────────────

function main() {
  // 1. 获取远程已应用的 migration (version + name)
  console.log('正在查询远程 migration 历史...')
  const historyResult = dbQuery(
    'SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;',
  )
  if (historyResult.status !== 0) {
    console.error('无法查询远程 migration 历史:')
    console.error(historyResult.stdout)
    console.error(historyResult.stderr)
    process.exit(1)
  }

  const appliedVersions = new Set()
  const appliedNames = new Set()
  const rows = parseTableOutput(historyResult.stdout, ['version', 'name'])
  for (const row of rows) {
    if (row.version) appliedVersions.add(row.version)
    if (row.name) appliedNames.add(row.name)
  }
  console.log(`远程已应用 ${appliedVersions.size} 个 migration。`)

  // 2. 读取本地 migration 文件
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const localMigrations = files.map(parseMigrationFilename).filter(Boolean)

  // 3. 找出待推送的 migration（version 和 name 都不在远程中）
  const pending = localMigrations.filter(
    (m) => !appliedVersions.has(m.version) && !appliedNames.has(m.name),
  )
  const skippedByName = localMigrations.filter(
    (m) => !appliedVersions.has(m.version) && appliedNames.has(m.name),
  )

  if (skippedByName.length > 0) {
    console.log(
      `跳过 ${skippedByName.length} 个本地版本号不同但名称已应用的 migration。`,
    )
  }

  if (pending.length === 0) {
    console.log('没有待推送的 migration，远程数据库已是最新。')
    process.exit(0)
  }

  console.log(`发现 ${pending.length} 个待推送 migration:`)
  for (const m of pending) {
    console.log(`  ${m.version} - ${m.name}`)
  }

  if (dryRun) {
    console.log('\nDRY RUN: 以上 migration 不会被实际推送。')
    process.exit(0)
  }

  // 4. 逐个应用
  let applied = 0
  for (const m of pending) {
    const filePath = join(MIGRATIONS_DIR, m.filename)
    console.log(`\n推送: ${m.version}_${m.name}...`)

    const execResult = dbQueryFile(filePath)
    if (execResult.status !== 0) {
      console.error(`推送失败: ${m.version}_${m.name}`)
      if (execResult.stdout) console.error(execResult.stdout)
      if (execResult.stderr) console.error(execResult.stderr)
      console.error(`\n已成功推送 ${applied} 个，在第 ${applied + 1} 个失败。`)
      console.error('请修复后重新运行。已推送的 migration 不会重复执行。')
      process.exit(1)
    }

    // 在 migration 历史表中记录
    const insertSQL = `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${escapeSQL(m.version)}', '${escapeSQL(m.name)}') ON CONFLICT (version) DO NOTHING;`
    const recordResult = dbQuery(insertSQL)
    if (recordResult.status !== 0) {
      console.error(
        `警告: migration SQL 已执行成功但历史记录插入失败: ${m.version}`,
      )
      console.error('请手动检查 supabase_migrations.schema_migrations 表。')
      if (recordResult.stdout) console.error(recordResult.stdout)
      if (recordResult.stderr) console.error(recordResult.stderr)
    }

    applied++
    console.log(`完成: ${m.version}_${m.name}`)
  }

  console.log(`\n全部完成，共推送 ${applied} 个 migration。`)
}

main()
