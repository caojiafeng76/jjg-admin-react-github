import { spawnSync } from 'node:child_process'

export function printUsageAndExit(usageText) {
  console.log(usageText)
  process.exit(0)
}

export function hasExplicitTarget(args) {
  return (
    args.includes('--linked') ||
    args.includes('--local') ||
    args.includes('--db-url')
  )
}

export function resolveTargetArgs(args) {
  const forwardArgs = [...args]
  const envDbUrl = process.env.SUPABASE_DB_URL?.trim()

  if (hasExplicitTarget(forwardArgs)) {
    return {
      forwardArgs,
      targetMode: forwardArgs.includes('--db-url') ? 'db-url' : 'explicit',
    }
  }

  if (envDbUrl) {
    return {
      forwardArgs: ['--db-url', envDbUrl, ...forwardArgs],
      targetMode: 'db-url-env',
    }
  }

  return {
    forwardArgs: ['--linked', ...forwardArgs],
    targetMode: 'linked',
  }
}

export function runSupabaseCli(cliArgs) {
  const result = spawnSync(process.execPath, ['x', 'supabase', ...cliArgs], {
    encoding: 'utf8',
    stdio: 'pipe',
  })

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  return result
}

export function buildCombinedOutput(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
}

export function printFailureDiagnosis({ commandLabel, targetMode, output }) {
  const normalizedOutput = output.toLowerCase()

  if (
    normalizedOutput.includes('docker daemon') ||
    normalizedOutput.includes('docker_engine') ||
    normalizedOutput.includes('container health')
  ) {
    console.error(
      '\n诊断结果: 当前失败是本地 Docker 容器模式问题，不是 Supabase login 问题。',
    )
    console.error('处理建议:')
    console.error(
      '1. 不要再用 supabase start/status/local 路径执行数据库任务。',
    )
    console.error('2. 远程执行 migration 用 bun run db:push。')
    console.error('3. 一次性 SQL 用 bun run db:query -- --file <sql-file>。')
    console.error('4. 如果确实需要本地容器，再先启动 Docker Desktop。')
    return
  }

  if (
    normalizedOutput.includes('access token not provided') ||
    normalizedOutput.includes('failed to load access token') ||
    normalizedOutput.includes('you need to be logged in') ||
    normalizedOutput.includes('not linked') ||
    normalizedOutput.includes('have you run supabase link') ||
    normalizedOutput.includes('cannot find project ref')
  ) {
    console.error('\n诊断结果: 当前失败是未登录或未绑定远程项目。')
    console.error('处理建议:')
    console.error('1. 先执行 bunx supabase login。')
    console.error('2. 再执行 bunx supabase link --project-ref <project-ref>。')
    console.error('3. 然后重新运行对应的 db 命令。')
    return
  }

  if (
    normalizedOutput.includes('failed to connect to postgres') ||
    normalizedOutput.includes('tls error') ||
    normalizedOutput.includes('i/o timeout') ||
    normalizedOutput.includes('eof')
  ) {
    console.error(
      `\n诊断结果: ${commandLabel} 在远程数据库连接阶段失败，当前更像网络或直连链路问题，不是 login 问题。`,
    )
    console.error('处理建议:')
    console.error(
      '1. 先执行 bun run db:doctor，确认 login、query、push 分别卡在哪一步。',
    )
    if (targetMode === 'linked') {
      console.error(
        '2. 如果你的网络环境拦截了 linked 直连，改为设置 SUPABASE_DB_URL 后重试。',
      )
    }
    console.error(
      '3. DDL / RLS / 索引等结构变更也可改走 Supabase MCP apply_migration。',
    )
    console.error(
      '4. 一次性 SQL 可继续使用 bun run db:query，或改走 Supabase MCP execute_sql。',
    )
    return
  }

  console.error('\n诊断结果: Supabase CLI 执行失败，但不属于已识别的常见类型。')
  console.error('建议附加 --debug 或先执行 bun run db:doctor 收集诊断信息。')
}
