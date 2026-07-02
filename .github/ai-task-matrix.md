# AI Task Matrix

本文件用于把 AI 执行流程从“阅读长规则后自行判断”压缩成可执行分流表。具体编码规范仍以 `AGENTS.md` 和 `.github/copilot-instructions.md` 为准。

## Fast Lane

满足以下全部条件时，可以跳过完整 Spec Workflow，直接走最小化实现：

- 需求范围明确，不需要重新讨论方案或业务口径。
- 不涉及数据库结构、RLS、权限、状态流转、业务计算、路由菜单或跨模块联动。
- 只修改少量文档、脚本、单文件样式、文案或局部配置。
- 可以通过一个明确命令或人工检查完成验证。

Fast lane 输出仍需说明：为什么跳过完整 Spec Workflow、改了什么、如何验证、剩余风险。

## Task Routing

| 任务类型                           | 必选工具 / skill                                              | 优先查看                                                                             | 最低验证                                                        |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 页面、表单、列表、详情             | Serena, `query-before-page-edit`, `ant-design`                | feature 目录、服务层、路由、菜单、权限                                               | `bun run typecheck` + 相关测试；影响流程时补页面验证            |
| Query / Mutation / 缓存联动        | Serena, `tanstack-query`                                      | hook、queryKey、invalidateQueries、调用点                                            | `bun run test` + 缓存刷新链路检查                               |
| 数据库、RLS、索引、迁移            | Sequential Thinking, Serena, Supabase MCP, `db-change` prompt | migration、服务层、类型、权限策略                                                    | SQL / migration 验证；执行 schema 变更后运行 `bun run db:types` |
| Excel 导入、批量 upsert、数据修复  | Serena, `supabase-bulk-operations`                            | utils、导入入口、服务层、唯一键/冲突键                                               | 单元测试 + 小样本导入或 dry-run                                 |
| PDF / Excel 导出                   | Serena                                                        | utils、导出 hook、表格字段、中文字体初始化                                           | 相关单测；必要时手动导出验证                                    |
| 业务规则、状态流转、数量/工时/成本 | Sequential Thinking, Serena, `business-rules-engine`          | 写入入口、展示入口、汇总入口、测试                                                   | 规则单测 + 受影响页面/汇总口径检查                              |
| 手机端、H5、扫码、触屏             | Serena, `mobile-responsiveness`, `webapp-testing`             | 移动页面、路由、权限、扫码依赖                                                       | 移动 viewport 页面验证 + `bun run typecheck`                    |
| 路由、菜单、标题、权限             | Serena                                                        | `router.tsx`, `routeLabels.ts`, `MainMenu.tsx`, `access.ts`, `permissionRegistry.ts` | 路由入口检查 + 权限边界回归                                     |
| 脚本、MCP、开发流程配置            | Sequential Thinking, Serena 或文件搜索                        | `package.json`, `.mcp.json`, prompts, instructions, README/ENV_SETUP                 | 相关脚本 help/dry-run + JSON/配置解析                           |
| 代码评审                           | Serena + review prompt                                        | diff、受影响调用链、测试覆盖                                                         | 不改代码；按严重程度列 findings                                 |

## Tool Health

开始较大任务前建议运行：

```bash
bun run ai:doctor
```

它用于快速检查 Bun、Supabase CLI、MCP 配置、环境变量、Spec Workflow、Graphify 索引等工具状态。检查结果是执行辅助，不替代任务本身的验证。
