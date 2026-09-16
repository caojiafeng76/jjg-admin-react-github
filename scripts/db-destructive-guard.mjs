// Optional agent hook; repository CLI entrypoints enforce confirmation independently.
let input = ''
for await (const chunk of process.stdin) input += chunk
let payload
try {
  payload = JSON.parse(input || '{}')
} catch {
  console.error('数据库保护 hook 输入不是合法 JSON。')
  process.exit(1)
}
if (payload.hook_event_name === 'PreToolUse') {
  const toolInput = payload.tool_input ?? {}
  const command = String(toolInput.command ?? toolInput.cmd ?? '')
  const rawDatabaseCommand =
    /\b(?:supabase\s+db\s+(?:query|push|reset)|psql)\b/i.test(command)
  if (rawDatabaseCommand) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            '请使用仓库 db:query / db:push 保护入口；数据库重置不在自动执行范围内。',
        },
      }),
    )
  }
}
