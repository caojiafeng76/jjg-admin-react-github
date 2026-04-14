import {
  buildCombinedOutput,
  printFailureDiagnosis,
  resolveTargetArgs,
  runSupabaseCli,
} from './supabase-cli-utils.mjs'

function runCheck(
  label,
  cliArgs,
  { diagnose = false, targetMode = 'explicit' } = {},
) {
  console.log(`\n=== ${label} ===`)
  const result = runSupabaseCli(cliArgs)
  const ok = (result.status ?? 1) === 0 && !result.error

  if (!ok && diagnose) {
    printFailureDiagnosis({
      commandLabel: label,
      targetMode,
      output: buildCombinedOutput(result),
    })
  }

  console.log(`结果: ${ok ? 'PASS' : 'FAIL'}`)
  return ok
}

const queryTarget = resolveTargetArgs([])
const pushTarget = resolveTargetArgs(['--dry-run'])

const checks = [
  runCheck('CLI 版本检查', ['--version']),
  runCheck('登录与项目可见性检查', ['projects', 'list'], { diagnose: true }),
  runCheck(
    '一次性 SQL 查询链路检查',
    ['db', 'query', ...queryTarget.forwardArgs, 'select now();'],
    {
      diagnose: true,
      targetMode: queryTarget.targetMode,
    },
  ),
  runCheck(
    'Migration 预演链路检查',
    ['db', 'push', ...pushTarget.forwardArgs],
    {
      diagnose: true,
      targetMode: pushTarget.targetMode,
    },
  ),
]

const failedCount = checks.filter((item) => !item).length

console.log('\n=== 汇总 ===')
console.log(`共 ${checks.length} 项检查，失败 ${failedCount} 项。`)

if (failedCount > 0) {
  console.error('建议先按上面的诊断信息处理，再重试 db:push 或 db:query。')
  process.exit(1)
}

console.log('Supabase CLI 当前可正常执行仓库数据库命令。')
