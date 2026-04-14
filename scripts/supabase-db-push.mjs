import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法:
  bun run db:push
  bun run db:push -- --dry-run
  bun run db:push -- --include-all
  bun run db:push -- --db-url <postgres-url>

说明:
  - 默认自动追加 --linked，不依赖本地 Docker 容器
  - 结构变更、RLS、约束、索引优先放到 supabase/migrations/*.sql 后再执行 db push
  - 如果尚未绑定远程项目，先执行: bunx supabase login && bunx supabase link --project-ref <project-ref>`)
  process.exit(0)
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
  ['x', 'supabase', 'db', 'push', ...forwardArgs],
  {
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(`执行 Supabase db push 失败: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
