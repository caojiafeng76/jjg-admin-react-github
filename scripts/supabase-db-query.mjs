import { withSqlSnapshot } from './db-sql-snapshot.mjs'
import { readFileSync } from 'node:fs'
import { confirmSqlExecution, parseQueryArgs } from './db-sql-guard.mjs'
import {
  describeDatabaseTarget,
  resolveTargetArgs,
  runSupabaseCli,
} from './supabase-cli-utils.mjs'

const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法:
  bun run db:query -- --file docs/sql-drafts/example.sql
  bun run db:query -- "select now();"
  bun run db:query -- --db-url <postgres-url> --file path/to/file.sql

默认 --linked 通过 Management API 查询；显式目标保持不变。
SQL 文件只读取一次，执行已检查的内容，避免文件在确认后被替换。
删除、清空、删结构或动态执行需要用户在交互终端核对并连续确认三次。
非交互执行遇到危险 SQL 直接失败，不接受 --yes、环境变量或旧 hook 状态跳过。
结构变更请优先写 migration，再使用 db:push。`)
  process.exit(0)
}
try {
  const parsed = parseQueryArgs(args)
  const sql =
    parsed.file === undefined ? parsed.sql : readFileSync(parsed.file, 'utf8')
  if (!sql.trim()) throw new Error('SQL 内容不能为空。')
  const { forwardArgs } = resolveTargetArgs(parsed.forwardArgs)
  const target = describeDatabaseTarget(forwardArgs)
  await confirmSqlExecution(sql, target)
  if (target !== describeDatabaseTarget(forwardArgs))
    throw new Error('数据库绑定在确认期间发生变化，请重新检查。')
  const result = withSqlSnapshot(sql, (file) =>
    runSupabaseCli(['db', 'query', ...forwardArgs, '--file', file]),
  )
  process.exit(result.error ? 1 : (result.status ?? 1))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'SQL 执行失败。')
  process.exit(1)
}
