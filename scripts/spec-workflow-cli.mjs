import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printUsageAndExit()
}

const result = spawnSync(process.execPath, ['x', 'openspec', ...args], {
  encoding: 'utf8',
  stdio: 'pipe',
})

if (result.stdout) {
  process.stdout.write(result.stdout)
}

if (result.stderr) {
  process.stderr.write(result.stderr)
}

if (result.error) {
  console.error(`Spec Workflow CLI wrapper 执行失败: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)

function printUsageAndExit() {
  console.log(`Spec Workflow CLI wrapper

用法:
  bun run spec -- <openspec-args...>

常用示例:
  bun run spec:list
  bun run spec -- status --change add-foo --json
  bun run spec -- instructions apply --change add-foo --json
  bun run spec -- new change add-foo

说明:
  - 这个 wrapper 是本仓库 Spec Workflow 状态的唯一调用入口。
  - 它统一通过 repo-local openspec CLI 执行真实状态查询与指令拉取。
  - spec-workflow-mcp 仅负责编辑器 MCP 接入与可视化，不作为独立状态来源。
`)
  process.exit(0)
}
