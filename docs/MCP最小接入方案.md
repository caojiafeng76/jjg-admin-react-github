# MCP 最小接入方案

本项目的数据库工作流已切换为 Supabase CLI，不再配置数据库 MCP。当前项目注册以根目录 `.mcp.json` 与 `.codex/config.toml` 为准，保留 Context7 和 Chrome DevTools。

## 当前分工

| 工作                           | 工具                                         |
| ------------------------------ | -------------------------------------------- |
| 表结构查询、数据核对、数据修复 | `bun run db:query -- --file <sql-file>`      |
| migration 预演、执行           | `bun run db:push:dry-run`、`bun run db:push` |
| 数据库连接排查                 | `bun run db:doctor`                          |
| 数据库类型生成                 | `bun run db:types`                           |
| 依赖文档查询                   | Context7 或官方文档                          |
| 页面调试                       | Chrome DevTools 或项目浏览器测试流程         |
| Figma 设计上下文               | 按任务需要使用官方 Figma MCP，沿用项目规则   |

`db:push:api` 仅保留旧命令兼容性，内部使用与 `db:push` 相同的标准 CLI，不再自行登记迁移历史。

## 配置与凭据

移除的是本项目的数据库 MCP 注册，不是 Supabase SDK、CLI 或数据库连接配置。保留 `SUPABASE_ACCESS_TOKEN`、项目绑定及前端 Supabase 环境变量；token 放在本机用户环境变量或受信凭据存储中，不写入仓库。

修改项目 MCP 配置后，新建会话或重启客户端以刷新工具列表。客户端全局插件或其他项目的注册不属于本项目配置；历史会话中已加载的工具不会由修改文件即时卸载。

## 验证

1. `bun run ai:doctor` 检查保留的 MCP 与本地工具链。
2. `bun run db:doctor` 检查登录、只读 SQL 和标准 migration 预演。
3. `bun run test` 覆盖 SQL 内容保护、三次确认、危险文件非交互拦截和迁移文件变更检查。

危险 SQL 必须由用户在交互终端核对目标与 SQL 后连续确认三次。脚本是防误操作保护，不是数据库权限或 SQL 沙箱的替代品；助手不得绕过入口、代填确认或直接运行 reset。

详细流程见 [Supabase 数据库脚本执行说明](Supabase数据库脚本执行说明.md)。
