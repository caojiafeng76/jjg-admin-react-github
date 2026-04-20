import os from 'node:os'
import path from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const input = await readJsonFromStdin()

const sessionId = sanitizeSessionId(input.session_id || 'default-session')
const statePath = path.join(
  os.tmpdir(),
  `jjg-db-delete-confirm-${sessionId}.json`,
)

const state = readState(statePath)

if (input.hook_event_name === 'UserPromptSubmit') {
  handleUserPromptSubmit(input.user_prompt || '', statePath, state)
  process.exit(0)
}

if (input.hook_event_name === 'PreToolUse') {
  handlePreToolUse(input, statePath, state)
  process.exit(0)
}

process.exit(0)

function readJsonFromStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (error) {
        reject(error)
      }
    })
    process.stdin.on('error', reject)
  })
}

function sanitizeSessionId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_')
}

function readState(filePath) {
  if (!existsSync(filePath)) {
    return { confirmCount: 0 }
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return { confirmCount: 0 }
  }
}

function writeState(filePath, nextState) {
  writeFileSync(filePath, JSON.stringify(nextState), 'utf8')
}

function resetState(filePath) {
  writeState(filePath, { confirmCount: 0 })
}

function handleUserPromptSubmit(userPrompt, filePath, currentState) {
  const prompt = String(userPrompt).trim()

  if (!prompt) {
    return
  }

  if (prompt === '取消删除数据库操作确认') {
    resetState(filePath)
    return
  }

  const match = prompt.match(/^确认删除数据库操作\s*第([1-9]\d*)次$/)

  if (!match) {
    if (currentState.confirmCount > 0) {
      resetState(filePath)
    }
    return
  }

  const step = Number(match[1])
  const expectedStep = currentState.confirmCount + 1

  if (step === 1) {
    writeState(filePath, { confirmCount: 1 })
    return
  }

  if (step === expectedStep) {
    writeState(filePath, { confirmCount: step })
    return
  }

  resetState(filePath)
}

function handlePreToolUse(payload, filePath, currentState) {
  const toolName = String(payload.tool_name || '')
  const toolInput = payload.tool_input || {}

  if (!isDangerousDatabaseDeletion(toolName, toolInput)) {
    return
  }

  if ((currentState.confirmCount || 0) >= 3) {
    resetState(filePath)
    return
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        '危险数据库删除操作需要用户本人在当前会话中明确确认至少 3 次。',
    },
    systemMessage:
      '已阻止危险数据库删除操作。请先让用户本人在当前会话中分别发送以下三条确认消息，然后再重新尝试执行：\n1. 确认删除数据库操作 第1次\n2. 确认删除数据库操作 第2次\n3. 确认删除数据库操作 第3次\n如需取消，发送：取消删除数据库操作确认',
  }

  process.stdout.write(JSON.stringify(output))
}

function isDangerousDatabaseDeletion(toolName, toolInput) {
  const serializedInput = JSON.stringify(toolInput).toLowerCase()
  const normalizedToolName = toolName.toLowerCase()

  const destructiveSqlPattern =
    /\b(delete\s+from|drop\s+database|drop\s+schema|drop\s+table|drop\s+view|drop\s+materialized\s+view|truncate\s+table|truncate\b|alter\s+table\s+[^;]*\s+drop\s+column|alter\s+table\s+[^;]*\s+drop\s+constraint)\b/i

  const destructiveCliPattern =
    /\b(supabase\s+db\s+reset|prisma\-migrate\-reset|psql\b|bun\s+run\s+db:query\b|drop\s+database|drop\s+table|truncate\b|delete\s+from)\b/i

  const dangerousToolNamePattern =
    /(mcp_supabase_execute_sql|mcp_supabase_apply_migration|mcp_supabase_reset_branch|mcp_supabase_delete_branch|prisma-migrate-reset|run_in_terminal|bash)/i

  if (!dangerousToolNamePattern.test(normalizedToolName)) {
    return false
  }

  return (
    destructiveSqlPattern.test(serializedInput) ||
    destructiveCliPattern.test(serializedInput)
  )
}
