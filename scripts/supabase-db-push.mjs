import { resolve } from 'node:path'
import {
  createPoolerConnection,
  resolvePushTarget,
} from './supabase-pooler.mjs'
import {
  describeDatabaseTarget,
  runSupabaseCli,
} from './supabase-cli-utils.mjs'
import { confirmSqlExecution } from './db-sql-guard.mjs'
import {
  captureMigrationPlan,
  snapshotMigrationFiles,
} from './db-migration-guard.mjs'

const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法:
  bun run db:push:dry-run
  bun run db:push
  bun run db:push -- --db-url <postgres-url>
  bun run db:push -- --local
  bun run db:push -- --no-fallback --dry-run

默认通过已绑定项目的 Session Pooler 运行标准 Supabase db push。
临时密码仅传入子进程 PGPASSWORD；需要本机 SUPABASE_ACCESS_TOKEN。
显式 --db-url、SUPABASE_DB_URL、--local 保持原目标。
--no-fallback 使用原生 --linked 连接选择；不再自动切换 API 裸执行迁移。
正式推送先执行结构化预演并检查待执行 SQL；危险操作需用户终端确认三次。
seed/roles 请写成 migration；预演不会执行迁移。`)
  process.exit(0)
}

try {
  if (args.some((arg) => arg.startsWith('--dry-run=')))
    throw new Error('请使用独立的 --dry-run 参数。')
  const isDryRun = args.includes('--dry-run')
  if (
    !isDryRun &&
    args.some((arg) =>
      ['--include-seed', '--include-roles'].includes(arg.split('=')[0]),
    )
  ) {
    throw new Error('seed 和 roles 请拆为可审查的 migration 后再执行。')
  }
  const workdirIndex = args.indexOf('--workdir')
  const workdir = resolve(
    args
      .find((arg) => arg.startsWith('--workdir='))
      ?.slice('--workdir='.length) ??
      (workdirIndex >= 0
        ? args[workdirIndex + 1]
        : process.env.SUPABASE_WORKDIR) ??
      process.cwd(),
  )
  const target = resolvePushTarget(args)
  let cliArgs = target.args
  let env = process.env
  if (target.mode === 'pooler') {
    const connection = await createPoolerConnection(resolve(workdir))
    cliArgs = ['--db-url', connection.url, ...target.args]
    env = { ...process.env, ...connection.env }
    console.log('通过已绑定项目的 Session Pooler 执行标准 migration 检查。')
  }
  if (!isDryRun) {
    const previewArgs = []
    for (let i = 0; i < cliArgs.length; i++) {
      if (['--output-format', '--output', '-o'].includes(cliArgs[i])) {
        i++
        continue
      }
      if (
        cliArgs[i].startsWith('--output-format=') ||
        cliArgs[i].startsWith('--output=')
      )
        continue
      previewArgs.push(cliArgs[i])
    }
    const beforePreview = snapshotMigrationFiles(workdir)
    const preview = runSupabaseCli(
      ['db', 'push', ...previewArgs, '--dry-run', '--output-format', 'json'],
      { env },
    )
    if (preview.error || preview.status !== 0) process.exit(1)
    const plan = captureMigrationPlan(preview.stdout, workdir, beforePreview)
    const databaseTarget = describeDatabaseTarget(cliArgs)
    await confirmSqlExecution(plan.sql, databaseTarget)
    plan.assertUnchanged()
    if (databaseTarget !== describeDatabaseTarget(cliArgs))
      throw new Error('数据库绑定在确认期间发生变化。')
  }
  const result = runSupabaseCli(['db', 'push', ...cliArgs], { env })
  if (result.error) console.error('Supabase CLI 进程未能正常启动。')
  process.exit(result.error ? 1 : (result.status ?? 1))
} catch (error) {
  console.error(error instanceof Error ? error.message : '数据库预演失败。')
  process.exit(1)
}
