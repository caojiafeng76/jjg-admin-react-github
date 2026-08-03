# 更新日志

本文件记录项目的所有重要修改。每次修改完成后，必须在本文件顶部追加一条记录，最新记录置顶；仅修改本文件以补充日志时无需重复记录。

## 记录格式

```markdown
## YYYY-MM-DD

- **类别**：新增 / 变更 / 修复 / 重构 / 性能 / 文档
- **范围**：受影响的模块或文件
- **摘要**：本次修改的内容与目的
- **验证**：执行过的检查、测试或构建命令；未执行时说明原因
```

## 2026-08-03

- **类别**：变更
- **范围**：精切转移单、精切转移单导出、Supabase migration
- **摘要**：将“长料数量”明确为“实际长料数量”，新增流程卡及 ERP 长料数量的录入/展示字段；导出表新增两项数量与按“实际 − 对照”自动计算的差异公式。
- **验证**：新增导出回归测试并完成 RED→GREEN（2 个用例）；远端 migration 已应用并核验三个字段的类型、可空性与中文注释，`database.types.ts` 已通过 Supabase 生成器刷新；`bun run typecheck`、`bun lint`、`bun run build` 和目标 Ant Design lint 均通过。完整 Vitest 套件在 434/439 个断言通过后遭遇无归属 worker 退出。

## 2026-08-02

- **类别**：修复
- **范围**：`src/features/tooling-fixture/ToolingFixturePublicPage.tsx`
- **摘要**：为公开工装扫码 H5 页面建立独立的视口滚动容器，避免全局 `body` 禁止滚动时长内容被裁切。
- **验证**：新增 H5 滚动布局回归测试，并完成目标测试、类型检查、lint、构建和移动端浏览器验证。

## 2026-08-02

- **类别**：新增
- **范围**：工装管理模块、Supabase 工装资料与出入记录迁移、路由菜单与权限
- **摘要**：新增工装资料 CRUD、唯一二维码、公开扫码使用/归还页面、原子状态流转与出入记录查询；保留现有刀具模块不变。
- **验证**：目标测试 5 个文件、7 个测试通过；`bun run typecheck`、`bun lint`、`bun run build`、Ant Design lint 均通过；远端迁移已应用并以事务回滚方式验证匿名 RPC 的使用、重复使用拒绝、归还和状态一致性。最终 `bun run test` 为 102/103 个文件、431/436 个测试通过，剩余 1 个既有 `apiWorkshopOrderOptions` Vitest worker 异常，与本次改动无关。

## 2026-07-25

- **类别**：修复
- **范围**：`src/features/syney/SpecList/`
- **摘要**：修复规格创建 Modal 首次打开后“确定”偶发不触发表单提交的问题；改为在操作发生时读取最新 Form ref，并恢复创建成功/失败消息容器，避免后端拒绝时无可见反馈；新增首次提交与失败提示回归测试。
- **验证**：`bun run test`（98 个文件、429 个测试）、`bun run typecheck`、`bun lint`、`bun run build` 均通过；真实浏览器成功路径首次点击仅发起 1 次请求并关闭 Modal，失败路径显示“创建规格失败”；Graphify 增量更新、Ant Design lint、TypeScript no-excuse 检查通过；独立 Visual QA 双审查均为 PASS/HIGH。

## 2026-07-24

- **类别**：重构
- **范围**：`src/routes/AppRoutes.tsx`、`src/ui/PageLoading.tsx`、`src/utils/format.ts`、`src/utils/googleFontLoader.ts`、`src/utils/pdfUtils.ts`
- **摘要**：移除已确认无仓库消费者的旧路由占位文件、未使用加载组件及三个未使用导出，保留可能被外部调用或仅由文档引用的候选项。
- **验证**：删除前后 `bun run typecheck`、`bun run test`、`bun lint`、`bun run build` 均通过；删除批次逐项完成零引用扫描与类型检查；`git diff --check` 通过。

## 2026-07-24

- **类别**：变更
- **范围**：`src/features/workshop/StandardTimeList/StandardTimeTable.tsx`
- **摘要**：调整标准工时列表列顺序，将标准工时、日标准产能、理论工时紧跟在料号列之后。
- **验证**：目标表格测试通过；`bun run typecheck`、`bun run build`、`bun lint`、`bunx antd lint src/features/workshop/StandardTimeList/StandardTimeTable.tsx --format json` 通过。完整 `bun run test` 仅有既存的 `src/features/packaging-process/WorkOrderList/remoteEmployeeSelect.vitest.tsx` 失败，与本次改动无关。

## 2026-07-23

- **类别**：文档
- **范围**：`AGENTS.md`
- **摘要**：补齐 Graphify、Spec Workflow 和数据库 CLI 命令，确保项目指令清单与 `package.json` 脚本保持一致。
- **验证**：执行命令脚本一致性检查和 `git diff --check`。

## 2026-07-22

- **类别**：文档
- **范围**：项目更新日志文件名及相关指令引用
- **摘要**：将根目录更新日志文件名统一为全大写扩展名，并同步更新仓库内相关引用。
- **验证**：已完成旧文件名残留扫描、目标文件存在性检查及 `git diff --check`。

## 2026-07-22

- **类别**：修复
- **范围**：Serena MCP 配置、Codex / VS Code 用户级 MCP 配置、启动脚本
- **摘要**：将 Serena 从每个任务独立启动的 stdio 模式统一切换为固定 Streamable HTTP 单例；关闭自动打开的原生 Dashboard，改为仅在需要时手动通过浏览器访问。
- **验证**：已验证单例启动脚本可启动 `http://127.0.0.1:9121/mcp`，重复执行不会创建第二个监听实例；MCP 端点可访问，并已核对 Codex 项目级配置不再包含 Serena stdio 启动命令。

- **类别**：文档
- **范围**：项目更新日志规范与 AI 任务指令
- **摘要**：新增根目录 `CHANGELOG.MD`，并在 `AGENTS.md` 与 `.github/copilot-instructions.md` 中建立每次修改完成后记录更新日志的统一规则。
- **验证**：已检查项目指令文档、工作区状态及本文件格式。
