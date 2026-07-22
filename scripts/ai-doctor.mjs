#!/usr/bin/env bun

import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const results = []

function add(status, name, detail = '') {
  results.push({
    status,
    name,
    detail: String(detail).replace(/\s+/g, ' ').trim(),
  })
}

function readJson(relativePath) {
  const fullPath = join(root, relativePath)

  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'))
  } catch (error) {
    add('error', `${relativePath} parse`, error.message)
    return null
  }
}

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    timeout: 10000,
  })

  if (result.error || result.status !== 0) {
    const detail =
      result.error?.message ||
      result.stderr?.trim() ||
      result.stdout?.trim() ||
      'not available'
    add('warn', command, detail)
    return
  }

  const version = (result.stdout || result.stderr).trim().split(/\r?\n/)[0]
  add('ok', command, version)
}

function checkFile(relativePath, required = true) {
  const fullPath = join(root, relativePath)

  if (existsSync(fullPath)) {
    add('ok', relativePath)
    return true
  }

  add(required ? 'error' : 'warn', relativePath, 'missing')
  return false
}

function checkEnvFromDotenv(keys) {
  const envPath = join(root, '.env')
  const dotEnv = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''

  for (const key of keys) {
    const inProcess = Boolean(process.env[key])
    const inFile = new RegExp(`^${key}=`, 'm').test(dotEnv)

    if (inProcess || inFile) {
      add('ok', `env:${key}`, inProcess ? 'process env' : '.env')
    } else {
      add('warn', `env:${key}`, 'missing from process env and .env')
    }
  }
}

function checkMcpConfig() {
  const mcp = readJson('.mcp.json')
  if (!mcp?.mcpServers) return

  const expected = [
    'spec-workflow',
    'sequential-thinking',
    'supabase',
    'serena',
    'context7',
    'chrome-devtools',
  ]

  for (const name of expected) {
    if (mcp.mcpServers[name]) {
      add('ok', `mcp:${name}`, basename(mcp.mcpServers[name].command))
    } else {
      add('warn', `mcp:${name}`, 'not configured')
    }
  }
}

function checkGraphify() {
  const graphPath = join(root, 'graphify-out', 'graph.json')

  if (!existsSync(graphPath)) {
    add('warn', 'graphify index', 'missing; run bun run graphify:build')
    return
  }

  const stat = statSync(graphPath)
  const ageHours = Math.round((Date.now() - stat.mtimeMs) / 36_000) / 100
  add('ok', 'graphify index', `updated ${ageHours}h ago`)
}

function checkSpecWorkflow() {
  const result = spawnSync('bun', ['run', 'spec:list'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    timeout: 20000,
  })

  if (result.status !== 0) {
    add('warn', 'spec:list', result.stderr?.trim() || 'failed')
    return
  }

  add('ok', 'spec:list', 'available')
}

console.log('AI workflow doctor\n')

checkFile('package.json')
checkFile('.github/copilot-instructions.md')
checkFile('AGENTS.md')
checkFile('.github/ai-task-matrix.md', false)
readJson('package.json')
checkMcpConfig()
checkEnvFromDotenv([
  'VITE_REACT_APP_SUPABASE_URL',
  'VITE_REACT_APP_SUPABASE_KEY',
])

commandVersion('bun')
commandVersion('node')
commandVersion('supabase')
commandVersion('graphify', ['help'])
commandVersion('docker', ['info'])
checkGraphify()
checkSpecWorkflow()

let hasError = false

for (const result of results) {
  const label = result.status.toUpperCase().padEnd(5)
  console.log(
    `[${label}] ${result.name}${result.detail ? ` - ${result.detail}` : ''}`,
  )
  hasError ||= result.status === 'error'
}

const warnings = results.filter((result) => result.status === 'warn').length
const errors = results.filter((result) => result.status === 'error').length

console.log(`\nSummary: ${errors} error(s), ${warnings} warning(s)`)

if (hasError) {
  process.exitCode = 1
}
