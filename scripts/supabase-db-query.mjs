import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法:
  bun run db:query -- --file docs/sql-drafts/example.sql
  bun run db:query -- "select now();"
  bun run db:query -- --db-url <postgres-url> --file path/to/file.sql

说明:
  - 默认自动追加 --linked，不依赖本地 Docker 容器
  - 一次性数据修复、规则校验、只读核对脚本优先走 db query --file
  - DDL、RLS、约束、索引不要直接用 query 裸跑，优先写入 migration 后再 db push
  - 如果尚未绑定远程项目，先执行: bunx supabase login && bunx supabase link --project-ref <project-ref>`)
  process.exit(0)
}

const hasFile = args.includes('--file') || args.includes('-f')
const hasSqlText = args.some((arg) => !arg.startsWith('-'))

if (!hasFile && !hasSqlText) {
  console.error(
    '缺少 SQL 输入。请传入 --file <sql文件> 或直接传入 SQL 字符串。',
  )
  console.error(
    '示例: bun run db:query -- --file docs/sql-drafts/20260321_day3_add_employee_scoped_rls.sql',
  )
  process.exit(1)
}

const forwardArgs = [...args]
const hasTarget =
  forwardArgs.includes('--linked') ||
  forwardArgs.includes('--local') ||
  forwardArgs.includes('--db-url')

if (!hasTarget) {
  forwardArgs.unshift('--linked')
}

const result = spawnSync(
  process.execPath,
  ['x', 'supabase', 'db', 'query', ...forwardArgs],
  {
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(`执行 Supabase db query 失败: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
