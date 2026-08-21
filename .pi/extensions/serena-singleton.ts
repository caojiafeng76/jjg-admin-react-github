import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { spawn } from 'node:child_process'
import * as net from 'node:net'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'

const SERENA_PORT = 9121
const SERENA_HOST = '127.0.0.1'
const SERENA_URL = `http://${SERENA_HOST}:${SERENA_PORT}/mcp`

async function isPortListening(port: number, host: string, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let done = false
    const finish = (result: boolean) => {
      if (done) return
      done = true
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, host)
  })
}

async function waitForPort(
  port: number,
  host: string,
  totalMs = 60000,
  intervalMs = 1000,
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < totalMs) {
    if (await isPortListening(port, host)) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return isPortListening(port, host)
}

function getProjectRoot(cwd: string): string {
  // Walk up from cwd to find project root (contains .git, .mcp.json, or .serena/project.yml)
  // This handles pi started from a subdirectory.
  let current = resolve(cwd)
  while (true) {
    if (
      existsSync(join(current, '.git')) ||
      existsSync(join(current, '.mcp.json')) ||
      existsSync(join(current, '.serena', 'project.yml'))
    ) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return resolve(cwd)
}

async function ensureSerenaSingleton(cwd = process.cwd()): Promise<
  { ok: true; already: boolean } | { ok: false; error: string }
> {
  try {
    if (await isPortListening(SERENA_PORT, SERENA_HOST)) {
      return { ok: true, already: true }
    }

    const projectPath = getProjectRoot(cwd)
    const psScript = join(projectPath, 'scripts', 'start-serena-singleton.ps1')

    // Prefer PowerShell singleton script on Windows if it exists
    if (process.platform === 'win32' && existsSync(psScript)) {
      // Use powershell (Windows PowerShell) or pwsh if available
      const shell = existsSync('C:/Program Files/PowerShell/7/pwsh.exe') ? 'pwsh' : 'powershell'
      const child = spawn(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript], {
        cwd: projectPath,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })
      child.unref()
    } else {
      // Fallback: directly spawn uvx serena singleton via detached node process
      // This is cross-platform and does not require PowerShell.
      // We try to resolve uvx from PATH.
      const args = [
        '-p',
        '3.13',
        '--from',
        'serena-agent',
        'serena',
        'start-mcp-server',
        '--transport',
        'streamable-http',
        '--host',
        SERENA_HOST,
        '--port',
        String(SERENA_PORT),
        '--project',
        projectPath,
        '--context=codex',
        '--open-web-dashboard',
        'False',
      ]
      // uvx is provided by uv; try 'uvx' then full path fallback
      let uvxCmd = 'uvx'
      // On Windows, uvx.exe is usually at %USERPROFILE%\.local\bin\uvx.exe or via cargo
      // spawn will resolve via PATH, so we just use 'uvx'
      const child = spawn(uvxCmd, args, {
        cwd: projectPath,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })
      child.on('error', () => {
        // swallow; waitForPort will handle failure
      })
      child.unref()
    }

    const listening = await waitForPort(SERENA_PORT, SERENA_HOST, 60000, 1000)
    if (listening) {
      return { ok: true, already: false }
    }
    return { ok: false, error: `Serena 未在 ${totalMsToSec(60)} 秒内于 ${SERENA_URL} 就绪` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function totalMsToSec(ms: number): string {
  return `${Math.round(ms / 1000)}s`
}

export default async function (pi: ExtensionAPI) {
  // Async factory: ensure singleton is running before pi-mcp-adapter probes MCP servers.
  // This runs before session_start and before MCP HTTP probing, so the 9121 port should be ready
  // when pi-mcp-adapter tries to connect via url: http://127.0.0.1:9121/mcp
  try {
    await ensureSerenaSingleton(process.cwd())
  } catch {
    // best-effort; session_start handler will report
  }

  pi.on('session_start', async (_event, ctx) => {
    const result = await ensureSerenaSingleton(process.cwd())
    if (!result.ok) {
      ctx.ui.notify(
        `Serena 单例启动失败 (${SERENA_URL}): ${result.error}。\n请手动执行: bun run mcp:serena`,
        'error',
      )
      ctx.ui.setStatus('serena', 'Serena: 启动失败')
      return
    }
    if (result.already) {
      // already running - quiet success to avoid spam, but show subtle status
      ctx.ui.setStatus('serena', `Serena: ${SERENA_URL}`)
    } else {
      ctx.ui.notify(`Serena 单例已启动: ${SERENA_URL}`, 'info')
      ctx.ui.setStatus('serena', `Serena: ${SERENA_URL}`)
    }
  })

  pi.on('session_shutdown', async () => {
    // singleton is intentionally process-wide and shared across sessions/clients,
    // so we do NOT kill it on session shutdown. It will be reused by opencode,
    // other pi sessions, and future restarts until OS kills it or port is freed.
  })

  pi.registerCommand('serena', {
    description: '管理 Serena 单例 (status | restart | start)',
    handler: async (args, ctx) => {
      const sub = (args ?? '').trim().toLowerCase() || 'status'
      if (sub === 'status') {
        const listening = await isPortListening(SERENA_PORT, SERENA_HOST)
        if (listening) {
          ctx.ui.notify(`Serena 正在运行: ${SERENA_URL}`, 'info')
        } else {
          ctx.ui.notify(`Serena 未运行: ${SERENA_URL} (端口 ${SERENA_PORT} 无监听)`, 'warning')
        }
        return
      }
      if (sub === 'start' || sub === 'restart') {
        if (sub === 'restart') {
          ctx.ui.notify('重启 Serena 单例需先手动结束旧进程 (端口 9121)，然后重新 start…', 'warning')
        }
        ctx.ui.notify('正在确保 Serena 单例运行…', 'info')
        const result = await ensureSerenaSingleton(process.cwd())
        if (result.ok) {
          ctx.ui.notify(`Serena 就绪: ${SERENA_URL}`, 'info')
        } else {
          ctx.ui.notify(`Serena 启动失败: ${(result as { error: string }).error}`, 'error')
        }
        return
      }
      ctx.ui.notify(`未知子命令: ${sub}。可用: status | start | restart`, 'warning')
    },
  })
}
