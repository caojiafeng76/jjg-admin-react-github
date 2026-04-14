import {
  buildCombinedOutput,
  printFailureDiagnosis,
  printUsageAndExit,
  resolveTargetArgs,
  runSupabaseCli,
} from './supabase-cli-utils.mjs'

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  printUsageAndExit(`用法:
  bun run db:query -- --file docs/sql-drafts/example.sql
  bun run db:query -- "select now();"
  bun run db:query -- --db-url <postgres-url> --file path/to/file.sql

说明:
  - 默认自动追加 --linked；如果设置了 SUPABASE_DB_URL，则优先改走 --db-url
  - 一次性数据修复、规则校验、只读核对脚本优先走 db query --file
  - DDL、RLS、约束、索引不要直接用 query 裸跑，优先写入 migration 后再 db push
  - 如果尚未绑定远程项目，先执行: bunx supabase login && bunx supabase link --project-ref <project-ref>
  - 如果 linked 直连远程库失败，可改为设置 SUPABASE_DB_URL 后重试`)
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

const { forwardArgs, targetMode } = resolveTargetArgs(args)

const result = runSupabaseCli(['db', 'query', ...forwardArgs])

if (result.error) {
  console.error(`执行 Supabase db query 失败: ${result.error.message}`)
  process.exit(1)
}

if ((result.status ?? 1) !== 0) {
  printFailureDiagnosis({
    commandLabel: 'Supabase db query',
    targetMode,
    output: buildCombinedOutput(result),
  })
}

process.exit(result.status ?? 1)
