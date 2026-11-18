# AI 任务矩阵

[AGENTS.md](../AGENTS.md)定义通用流程、日志与格式化要求。多种任务同时适用时，执行相应验证的并集。

| 任务类型 | 优先查看或使用 | 最低验证 |
| --- | --- | --- |
| 文档、指令、任务模板 | 对应规则源、引用和生效路径 | 本地链接、配置入口、`git diff --check` |
| 普通前端 / TypeScript 应用代码 | 现有组件、调用方和测试 | `bun run test`、`bun run typecheck` |
| 页面、表单、列表、详情 | `query-before-page-edit`、`ant-design`、前端交互规范与功能域地图 | 前端基础验证。涉及用户流程时加 `bun run build` 和对应浏览器流程验证 |
| Query / Mutation / 缓存联动 | `tanstack-query`、query key 工厂、服务层和调用点 | 前端基础验证。验证受影响的列表、详情或汇总刷新 |
| 路由、菜单、权限 | 功能域地图、路由及菜单入口、权限注册和 RLS | 前端基础验证、`bun run build`，检查允许和拒绝路径 |
| 数据库、RLS、索引、迁移 | 仓库数据库 CLI，`.github/skills/supabase-rls-patterns` | migration 或 SQL 预演，按授权范围验证实际执行结果。执行 schema 变更后运行 `bun run db:types` |
| Excel 导入、批量 upsert、数据修复 | `.github/skills/supabase-bulk-operations`、冲突键与导入入口 | 规则单测、小样本或 dry-run。验证失败、重复与重试路径 |
| PDF / Excel 导出 | 导出工具、字段链路、中文字体初始化 | 相关单测。涉及用户流程时用样例验证生成结果 |
| 业务规则、状态流转、数量 / 工时 / 成本 | `.github/skills/business-rules-engine`、写入、展示和汇总入口 | 规则单测，核对相邻入口和汇总口径 |
| 手机端、H5、扫码或触屏 | `mobile-responsiveness`、`webapp-testing`、移动端入口和权限 | 前端基础验证、移动视口和关键流程，涉及用户流程时加 `bun run build` |
| 构建配置或依赖 | `package.json`、`bun.lock`、构建和 CI 配置 | `bun run test`、`bun run typecheck`、`bun run build`，涉及产物时运行 `bun run check:bundle` |
| 脚本、CLI、MCP、CI | 相关脚本或配置、现有工程守卫 | 相关测试和配置解析。按影响执行命令 help、dry-run 或临时环境验证 |
| 代码评审 | diff、受影响调用链和测试 | 保持只读，按严重程度报告可定位的发现及验证缺口 |

前端基础验证指 `bun run test` 和 `bun run typecheck`。涉及 Ant Design 组件用法时，按页面编辑 skill 核实组件 API 并运行针对性检查。浏览器工具的优先级见 [AGENTS.md](../AGENTS.md)。
