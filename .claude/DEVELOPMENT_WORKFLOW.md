# 开发流程规范（Claude Agent 执行准则）

> 本文件是 Claude Agent 的执行准则。每次开发任务前必须阅读并遵循。
> 核心原则：Spec Workflow + 任务类型 Prompt + 固定汇报格式
>
> 本文件是规范汇总，原文请参考：
>
> - `.github/copilot-instructions.md` - 详细 Copilot 执行规则
> - `.github/prompts/*.prompt.md` - 5 种任务 prompt（含详细执行要求）
> - `AGENTS.md` - 代码风格指南

---

## 1. 核心开发流程（Spec Workflow）

每个开发任务必须按以下阶段执行：

```
explore → propose → apply → archive
```

```bash
bun run spec:list                                    # 查看所有 change 状态
bun run spec -- status --change <name> --json     # 查看单个 change 详情
bun run spec -- instructions apply --change <name> # 查看 apply 阶段任务
```

### 阶段说明

| 阶段        | 触发条件                     | 产物                                                  |
| ----------- | ---------------------------- | ----------------------------------------------------- |
| **explore** | 需求不清、范围未定、仍在讨论 | -                                                     |
| **propose** | 准备写代码前                 | `changes/<name>/proposal.md`, `design.md`, `tasks.md` |
| **apply**   | proposal 获批后              | 按 tasks 顺序实施                                     |
| **archive** | 实现完成                     | -                                                     |

### 执行顺序（强制）

```
1. 先 reading + thinking（Sequential Thinking MCP）
2. 后 actions（coding）
```

---

## 2. 任务类型与 Prompt

| Prompt 文件              | 适用场景                | 使用命令        |
| ------------------------ | ----------------------- | --------------- |
| `task-exec.prompt.md`    | 通用开发、重构、排查    | `/task-exec`    |
| `bugfix.prompt.md`       | 缺陷修复、回归          | `/bugfix`       |
| `review.prompt.md`       | 代码评审、风险检查      | `/review`       |
| `db-change.prompt.md`    | Supabase 迁移、RLS、SQL | `/db-change`    |
| `feature-impl.prompt.md` | 新功能、模块扩展        | `/feature-impl` |

---

## 3. 统一执行流程

> 完整的逐步执行流程（复述目标 → Sequential Thinking → Serena → 选 skill → 建立上下文 → 计划 → 检查工作区 → 最小化改动 → 联动风险检查 → 验证 → 固定汇报）以 `.github/copilot-instructions.md` 为准，本文不再重复。

---

## 4. Skill 使用约定

| Skill                        | 适用场景                          |
| ---------------------------- | --------------------------------- |
| `tanstack-query`             | 列表/详情查询、Mutation、缓存失效 |
| `supabase-rls-patterns`      | RLS 策略、员工数据隔离、Auth 绑定 |
| `supabase-bulk-operations`   | Excel 导入、批量 upsert、数据修复 |
| `business-rules-engine`      | 状态流转、工时/成本计算、编辑约束 |
| `mobile-responsive-patterns` | 手机端、H5、响应式页面            |

---

## 5. 数据库变更规范

### 两类执行路径

| 类型                          | 工具                                       | 路径                        |
| ----------------------------- | ------------------------------------------ | --------------------------- |
| DDL/RLS/约束/索引/函数/触发器 | MCP `apply_migration` 或 `bun run db:push` | `supabase/migrations/*.sql` |
| 一次性数据修复/只读校验       | MCP `execute_sql` 或 `bun run db:query`    | `docs/sql-drafts/*.sql`     |

### 强制规则

- **禁止**手改 `src/services/database.types.ts`
- DDL 不要混进临时 SQL
- 删除/清空/重置操作必须用户确认 3 次
- Docker 不可用时用远程链路
- 涉及 RLS/鉴权/员工隔离时必须显式检查读写边界

### 数据库变更额外检查项

涉及 RLS、鉴权或员工数据隔离时必须检查：

- 谁可以读
- 谁可以写
- 是否存在越权路径
- 服务端角色和前端用户态是否混用

---

## 6. 代码风格

> 导入顺序、命名规范、组件结构、路径别名等详见 `AGENTS.md`（以其为准，本文不再重复）。

---

## 7. 禁止事项

- 禁止在未建立上下文时直接修改代码
- 禁止跳过 proposal/tasks 直接进入大段实现
- 禁止为"做完功能"而顺手重构无关模块
- 禁止放宽 RLS/删除约束来绕过报错
- 禁止把前端按钮隐藏当作鉴权手段
- 禁止在未验证的情况下结束任务（除纯文档文本调整外）
- 禁止把数据库结构变更混进临时 SQL

---

## 8. 参考文档

| 文件                                       | 说明                               |
| ------------------------------------------ | ---------------------------------- |
| `AGENTS.md`                                | 代码风格指南、导入规范、命名规范   |
| `.github/copilot-instructions.md`          | 详细 Copilot 执行规则              |
| `.github/prompts/task-exec.prompt.md`      | 通用任务执行（含 19 条详细要求）   |
| `.github/prompts/db-change.prompt.md`      | 数据库变更流程（含 17 条详细要求） |
| `.github/prompts/feature-impl.prompt.md`   | 新功能开发（含 21 条详细要求）     |
| `.github/prompts/bugfix.prompt.md`         | 缺陷修复流程                       |
| `.github/prompts/review.prompt.md`         | 代码评审流程                       |
| `.github/skills/tanstack-query/`           | TanStack Query 专项 skill          |
| `.github/skills/supabase-rls-patterns/`    | Supabase RLS 专项 skill            |
| `.github/skills/supabase-bulk-operations/` | 批量操作专项 skill                 |
| `.github/skills/business-rules-engine/`    | 业务规则专项 skill                 |
| `docs/Supabase数据库脚本执行说明.md`       | 数据库操作规范                     |
