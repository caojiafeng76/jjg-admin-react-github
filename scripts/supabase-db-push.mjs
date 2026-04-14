import { spawnSync } from 'node:child_process'
import {
  buildCombinedOutput,
  printFailureDiagnosis,
  printUsageAndExit,
  resolveTargetArgs,
  runSupabaseCli,
} from './supabase-cli-utils.mjs'

const args = process.argv.slice(2)
const noFallback = args.includes('--no-fallback')

if (args.includes('--help') || args.includes('-h')) {
  printUsageAndExit(`用法:
  bun run db:push
  bun run db:push -- --dry-run
  bun run db:push -- --include-all
  bun run db:push -- --db-url <postgres-url>
  bun run db:push -- --no-fallback

说明:
  - 默认自动追加 --linked；如果设置了 SUPABASE_DB_URL，则优先改走 --db-url
  - 结构变更、RLS、约束、索引优先放到 supabase/migrations/*.sql 后再执行 db push
  - 如果尚未绑定远程项目，先执行: bunx supabase login && bunx supabase link --project-ref <project-ref>
  - 如果直连远程库失败（如 WARP/代理环境），自动回退到 API 模式推送 migration
  - 传入 --no-fallback 可禁用自动回退`)
}

function isConnectionFailure(output) {
  const s = output.toLowerCase()
  return (
    s.includes('tls error') ||
    s.includes('i/o timeout') ||
    s.includes('failed to connect to postgres') ||
    s.includes('dial error') ||
    s.includes('eof')
  )
}

const filteredArgs = args.filter((a) => a !== '--no-fallback')
const { forwardArgs, targetMode } = resolveTargetArgs(filteredArgs)

const result = runSupabaseCli(['db', 'push', ...forwardArgs])

if (result.error) {
  console.error(`执行 Supabase db push 失败: ${result.error.message}`)
  process.exit(1)
}

if ((result.status ?? 1) === 0) {
  process.exit(0)
}

// 直连失败 — 判断是否为连接类错误，如果是则自动回退到 API 模式
const combinedOutput = buildCombinedOutput(result)

if (!noFallback && isConnectionFailure(combinedOutput)) {
  console.log('\n直连远程数据库失败（可能是 WARP/代理环境导致 TLS 拦截）。')
  console.log('自动回退到 API 模式推送 migration...\n')

  const dryRun = filteredArgs.includes('--dry-run')
  const apiArgs = [process.execPath, 'scripts/supabase-db-push-api.mjs']
  if (dryRun) apiArgs.push('--dry-run')

  const apiResult = spawnSync(apiArgs[0], apiArgs.slice(1), {
    stdio: 'inherit',
    cwd: import.meta.dirname ? undefined : process.cwd(),
  })

  process.exit(apiResult.status ?? 1)
}

// 非连接类错误，走原来的诊断逻辑
printFailureDiagnosis({
  commandLabel: 'Supabase db push',
  targetMode,
  output: combinedOutput,
})

process.exit(result.status ?? 1)
