import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export function printUsageAndExit(usageText) {
  console.log(usageText)
  process.exit(0)
}

function optionValue(args, name) {
  const equals = args.find((arg) => arg.startsWith(name + '='))
  if (equals) return equals.slice(name.length + 1)
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}

export function hasExplicitTarget(args) {
  return args.some((arg) =>
    ['--linked', '--local', '--db-url'].includes(arg.split('=')[0]),
  )
}

export function resolveTargetArgs(args) {
  const forwardArgs = [...args]
  if (hasExplicitTarget(args)) return { forwardArgs, targetMode: 'explicit' }
  if (process.env.SUPABASE_DB_URL?.trim())
    return {
      forwardArgs: ['--db-url', process.env.SUPABASE_DB_URL.trim(), ...args],
      targetMode: 'db-url-env',
    }
  return { forwardArgs: ['--linked', ...args], targetMode: 'linked' }
}

export function describeDatabaseTarget(args) {
  const connection = optionValue(args, '--db-url')
  if (connection) {
    const url = new URL(connection)
    url.password = ''
    url.search = ''
    return url.toString()
  }
  const workdir = resolve(
    optionValue(args, '--workdir') ??
      process.env.SUPABASE_WORKDIR ??
      process.cwd(),
  )
  if (args.includes('--local')) return `local:${workdir}`
  const ref = readFileSync(
    resolve(workdir, 'supabase/.temp/project-ref'),
    'utf8',
  ).trim()
  return `linked:${ref} (${workdir})`
}

export function normalizeCliResult(result, secrets = []) {
  const redact = (value) =>
    secrets
      .filter(Boolean)
      .reduce(
        (text, secret) =>
          text
            .replaceAll(secret, '[redacted]')
            .replaceAll(encodeURIComponent(secret), '[redacted]'),
        value ?? '',
      )
  const stdout = redact(result.stdout)
  const stderr = redact(result.stderr)
  const reportedError = `${stdout}\n${stderr}`.split('\n').some((line) => {
    try {
      return JSON.parse(line)._tag === 'Error'
    } catch {
      return false
    }
  })
  return {
    ...result,
    stdout,
    stderr,
    status: reportedError ? 1 : result.status,
  }
}

export function runSupabaseCli(cliArgs, { env = process.env } = {}) {
  const result = normalizeCliResult(
    spawnSync(process.execPath, ['x', 'supabase', ...cliArgs], {
      encoding: 'utf8',
      stdio: 'pipe',
      env,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    }),
    [env.PGPASSWORD, env.SUPABASE_DB_PASSWORD, env.SUPABASE_ACCESS_TOKEN],
  )

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
      '3. 结构变更使用 bun run db:push:dry-run 检查连接池与迁移历史。',
    )
    console.error(
      '4. 一次性 SQL 使用 bun run db:query；无法连接时先修复 CLI，不绕过保护入口。',
    )
    return
  }

  console.error('\n诊断结果: Supabase CLI 执行失败，但不属于已识别的常见类型。')
  console.error('建议附加 --debug 或先执行 bun run db:doctor 收集诊断信息。')
}
