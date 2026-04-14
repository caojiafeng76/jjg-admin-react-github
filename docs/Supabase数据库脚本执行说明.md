# Supabase 数据库脚本执行说明

## 当前问题

当前仓库里 `bunx supabase start` 和 `bunx supabase status` 无法启动，不是因为仓库缺配置，而是因为本机 Docker daemon 没有运行。

已复现的报错核心是：

- Docker engine pipe 不存在
- Supabase CLI 本地容器模式不可用

这意味着：

- 本地开发容器相关命令会失败
- 但远程数据库相关命令仍然可以继续使用

## 结论

这个仓库后续执行数据库脚本时，不要默认卡在 `supabase start`。

统一按下面的规则处理：

1. 结构变更、RLS、约束、索引、函数、触发器：先写 migration，再用 CLI `db push` 或 MCP `apply_migration` 执行。
2. 一次性数据修复、只读校验、临时规则核对 SQL：用 CLI `db query --file` 或 MCP `execute_sql` 执行。
3. 如果本地 Docker 没起，不影响远程 linked CLI 和 MCP 路径，不要因此中断数据库任务。

## 仓库命令

已添加以下 Bun 命令：

```bash
bun run db:push
bun run db:push:dry-run
bun run db:query -- --file docs/sql-drafts/20260321_day3_add_employee_scoped_rls.sql
bun run db:query -- "select now();"
```

说明：

- `db:push` 默认自动走 `--linked`
- `db:query` 默认自动走 `--linked`
- 不传 `--local` 就不会依赖本地 Docker 容器

## 使用前提

首次执行远程 CLI 前，先完成登录和项目绑定：

```bash
bunx supabase login
bunx supabase link --project-ref <your-project-ref>
```

如果你不想绑定，也可以显式传入远程数据库连接：

```bash
bun run db:push -- --db-url <postgres-url>
bun run db:query -- --db-url <postgres-url> --file path/to/file.sql
```

## 文件类型与执行方式

### 1. Migration 文件

目录：`supabase/migrations/`

适用场景：

- 新表
- 改字段
- 索引
- 约束
- RLS policy
- trigger / function

执行方式：

```bash
bun run db:push
```

预演方式：

```bash
bun run db:push:dry-run
```

### 2. 一次性 SQL 脚本

推荐目录：`docs/sql-drafts/`

适用场景：

- 数据修复
- 临时核对
- 小范围回填
- 只读分析 SQL

执行方式：

```bash
bun run db:query -- --file docs/sql-drafts/20260321_day2_add_employee_auth_binding_fields.sql
```

也可以直接执行一段 SQL：

```bash
bun run db:query -- "select count(*) from public.employees;"
```

## MCP 对应执行规则

如果当前环境已经接好了 Supabase MCP，则按下面的分工执行：

1. DDL、RLS、约束、索引、函数变更：优先使用 `apply_migration`
2. 一次性数据修复、核对 SQL：优先使用 `execute_sql`

建议仍然保留仓库内 SQL 文件，再把文件内容交给 MCP 执行，不要只在聊天里留下不可追踪的 SQL。

## 数据库任务默认规则

以后在这个仓库里处理数据库任务时，默认遵循：

1. 先区分 migration 还是一次性脚本
2. migration 走 `supabase/migrations/*.sql` + `bun run db:push`
3. 一次性脚本走 `docs/sql-drafts/*.sql` + `bun run db:query -- --file ...`
4. 如果 CLI 远程路径不可用，再切换 Supabase MCP
5. 不要因为本地 `supabase start` 失败就停住数据库任务

## 安全约束

- DDL 不要混进 `db query` 临时执行
- 数据修复脚本先小范围验证，再执行全量
- 高风险更新和删除必须先说明影响范围
- `src/services/database.types.ts` 仍然禁止手改，类型刷新走既有生成流程

## 推荐实践

对这个仓库来说，最稳妥的实际分工是：

- 日常 schema 演进：migration + `db push`
- 一次性修数：`docs/sql-drafts` + `db query --file`
- 无法使用 CLI 或希望走托管连接：Supabase MCP

这条规则的目标，是让数据库工作流不再被本地 Docker 环境绑定死。
