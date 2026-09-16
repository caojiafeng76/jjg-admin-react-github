import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export function buildPoolerConnection(cachedUrl, projectRef, login) {
  const url = new URL(cachedUrl.trim())
  if (
    url.protocol !== 'postgresql:' ||
    !url.hostname.endsWith('.pooler.supabase.com') ||
    decodeURIComponent(url.username) !== `postgres.${projectRef}` ||
    !login ||
    typeof login.role !== 'string' ||
    !login.role ||
    typeof login.password !== 'string' ||
    !login.password
  ) {
    throw new Error('连接池项目或临时登录凭据无效，已停止执行。')
  }
  url.username = `${login.role}.${projectRef}`
  url.password = ''
  url.port = '5432'
  return { url: url.toString(), env: { PGPASSWORD: login.password } }
}

export function resolvePushTarget(args, env = process.env) {
  for (const flag of [
    '--linked',
    '--local',
    '--db-url',
    '--workdir',
    '--profile',
  ]) {
    if (
      args.filter((arg) => arg === flag || arg.startsWith(flag + '=')).length >
      1
    ) {
      throw new Error(`参数 ${flag} 不能重复。`)
    }
  }
  if (
    args.some(
      (arg) => arg.startsWith('--linked=') || arg.startsWith('--local='),
    )
  ) {
    throw new Error('数据库目标开关请使用独立的 --linked 或 --local 参数。')
  }
  const has = (flag) =>
    args.some((arg) => arg === flag || arg.startsWith(`${flag}=`))
  if (['--local', '--linked', '--db-url'].filter(has).length > 1) {
    throw new Error('不能同时指定多个数据库目标。')
  }
  const forwarded = args.filter((arg) => arg !== '--no-fallback')
  if (has('--local') || has('--db-url'))
    return { mode: 'native', args: forwarded }
  if (env.SUPABASE_DB_URL?.trim() && !has('--linked')) {
    return {
      mode: 'native',
      args: ['--db-url', env.SUPABASE_DB_URL.trim(), ...forwarded],
    }
  }
  if (has('--no-fallback')) {
    return {
      mode: 'native',
      args: has('--linked') ? forwarded : ['--linked', ...forwarded],
    }
  }
  if (has('--profile')) {
    throw new Error(
      '连接池模式请使用 SUPABASE_ACCESS_TOKEN；自定义 CLI profile 请加 --no-fallback。',
    )
  }
  return { mode: 'pooler', args: forwarded.filter((arg) => arg !== '--linked') }
}

function readAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim())
    return process.env.SUPABASE_ACCESS_TOKEN.trim()
  if (process.platform === 'win32') {
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "[Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')",
      ],
      { encoding: 'utf8', windowsHide: true, timeout: 10000 },
    )
    if (result.status === 0 && result.stdout?.trim())
      return result.stdout.trim()
  }
  try {
    const token = readFileSync(
      resolve(homedir(), '.supabase/access-token'),
      'utf8',
    ).trim()
    if (token) return token
  } catch {
    /* CLI may store login credentials in the OS keychain instead. */
  }
  throw new Error(
    '连接池模式需要 SUPABASE_ACCESS_TOKEN（可配置为本机用户环境变量）；不会要求把 token 写入仓库。',
  )
}

export async function createPoolerConnection(workdir = process.cwd()) {
  const projectRef = readFileSync(
    resolve(workdir, 'supabase/.temp/project-ref'),
    'utf8',
  ).trim()
  if (!/^[a-z]{20}$/.test(projectRef))
    throw new Error('项目绑定无效，请重新运行 supabase link。')
  const cachedUrl = readFileSync(
    resolve(workdir, 'supabase/.temp/pooler-url'),
    'utf8',
  )
  const token = readAccessToken()
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/cli/login-role`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ read_only: false }),
      signal: AbortSignal.timeout(30000),
    },
  )
  if (!response.ok)
    throw new Error(`获取临时 CLI 登录角色失败（HTTP ${response.status}）。`)
  return buildPoolerConnection(cachedUrl, projectRef, await response.json())
}
