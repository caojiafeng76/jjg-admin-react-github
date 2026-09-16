# Supabase 数据库脚本执行说明

数据库统一使用仓库 CLI；本项目已移除数据库 MCP 注册。远程操作不依赖 Docker，本地 `start/status/reset` 的容器依赖不能作为远程任务的阻塞理由。

## 命令与凭据

| 任务                  | 命令                                                     |
| --------------------- | -------------------------------------------------------- |
| 连接与工具检查        | `bun run db:doctor`                                      |
| 只读查询              | `bun run db:query -- "select now();"`                    |
| SQL 文件执行          | `bun run db:query -- --file docs/sql-drafts/example.sql` |
| 迁移预演              | `bun run db:push:dry-run`                                |
| 正式迁移              | `bun run db:push`                                        |
| 历史命令兼容          | `bun run db:push:api -- --dry-run`                       |
| schema 执行后生成类型 | `bun run db:types`                                       |

首次使用先 `bunx supabase login`，再 `bunx supabase link --project-ref <project-ref>`。连接池入口需要 `SUPABASE_ACCESS_TOKEN`，优先当前进程，其次 Windows 用户环境变量或 CLI 本地 token 文件；只有系统钥匙串登录态时请额外配置此变量。移除 MCP 后仍保留该凭据，不能把 token 写进仓库。

`db:query` 默认通过 `--linked` 调用 Management API；`db:push` 默认读取已绑定项目的 Session Pooler（5432），获取临时 CLI 登录角色，将密码仅传入子进程 `PGPASSWORD`。这避免 Sparkle/mihomo Fake-IP 让 CLI 误判仅有 IPv6 的数据库地址可直连。无需修改 hosts、关闭代理或安装 Docker。

显式 `--db-url`、`SUPABASE_DB_URL` 或 `--local` 保持指定目标。`db:push -- --no-fallback` 保留原生 linked 连接选择，不提供无保护的 API 回退。连接失败先运行 doctor，不绕过仓库入口。

## migration 流程

结构、RLS、索引、函数等改动放入 `supabase/migrations/`。先预演，再通过标准 Supabase CLI 执行；由标准迁移机制管理版本与历史，不再使用自制表格解析、同名跳过或“执行 SQL 后单独补历史”的脚本。`db:push:api` 是同一入口的兼容别名，保留传入参数和失败退出码。

正式 `db:push` 自动先运行结构化 dry-run，检查待执行文件的实际内容；预演结果无法解析时停止，不猜测成功。文件在预演或确认期间变化会停止。`--include-seed` / `--include-roles` 的正式执行不支持，请拆成可审查 migration。dry-run 不执行 SQL，也不要求删除确认。

## SQL 内容保护和用户确认

`db:query` 支持一段 SQL 或一个 SQL 文件（包括 `--file=...`），不允许混用、多个文件、未知参数或多个数据库目标。读取文件内容后再检查；确认后的 SQL 写入独立临时快照交给 CLI，结束后清理，避免原文件变化及 Windows 命令行长度限制。执行的是同一份经过检查的 SQL。

保护器识别 DELETE、DROP、TRUNCATE、CTE 中的删除、删列等语句；跳过普通字符串及注释中的文字，处理嵌套注释。DO、CALL、EXECUTE、函数/触发器定义、PROGRAM 等需要额外复核的执行能力也进入确认流程。语法边界不完整或客户端元命令会被拒绝。

危险操作必须由用户本人在交互终端执行：

1. 查看显示的数据库目标、SQL 内容、12 位 SQL 指纹。
2. 按提示依次输入 `确认 <指纹> 第1次`、`确认 <指纹> 第2次`、`确认 <指纹> 第3次`。
3. 任一次不匹配即取消。确认仅用于当次内容与目标，不能复用。

非交互调用直接拦截，不能用 `--yes`、环境变量、旧 hook 状态或管道跳过；助手不得代填用户确认。普通 SELECT、INSERT 和 UPDATE 不额外询问，但执行范围仍须符合用户授权。数据库 reset 不提供自动执行入口。

`.github/hooks/db-destructive-guard.json` 只是可选辅助 hook，提示使用仓库入口；CLI 保护不依赖客户端加载 hook，也不依赖之前的聊天确认计数。

这是防误操作保护，不是权限隔离或通用 SQL 沙箱。数据库函数可能有副作用，用户仍需核对 SQL；数据库授权、RLS 与最小权限要求继续有效。禁止助手用裸 `supabase db query/push/reset`、`psql` 或其他渠道绕过保护。

## 验证

- `bun run test`：脚本安全回归与项目 Vitest。
- `bun run db:doctor`：真实只读查询及标准 migration 预演。
- `bun run db:push:api -- --dry-run`：旧命令兼容性。
- 实际 schema 执行成功后使用 `bun run db:types`；禁止手改自动生成类型。

## 2026-09-16 迁移历史对齐

活动目录按生产库 240 条版本排列；旧 190 个文件完整保存在 `supabase/migrations-archive/20260916/`。203 条采用官方历史 SQL；37 条因远程没有 statements，采用原仓库同名 SQL并标记重建来源，不表示已证明当时执行内容相同。

逐条来源与校验值见 `supabase/migration-history-20260916.json`，限制见 `supabase/migrations-archive/README.md`。本次对齐未执行 SQL 或修改远程历史；空库完整重放尚未验证。后续变更只新增 migration，不编辑已应用历史或批量 repair 来消除差异。
