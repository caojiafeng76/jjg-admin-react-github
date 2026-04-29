# 开发流程规范（Claude Agent 执行准则）

> 本文件是 Claude Agent 的执行准则。每次开发任务前必须阅读并遵循。
> 核心原则：Spec Workflow + 任务类型 Prompt + 固定汇报格式
>
> 本文件是规范汇总，原文请参考：
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

| 阶段 | 触发条件 | 产物 |
|------|----------|------|
| **explore** | 需求不清、范围未定、仍在讨论 | - |
| **propose** | 准备写代码前 | `changes/<name>/proposal.md`, `design.md`, `tasks.md` |
| **apply** | proposal 获批后 | 按 tasks 顺序实施 |
| **archive** | 实现完成 | - |

### 执行顺序（强制）

```
1. 先 reading + thinking（Sequential Thinking MCP）
2. 后 actions（coding）
```

---

## 2. 任务类型与 Prompt

| Prompt 文件 | 适用场景 | 使用命令 |
|------------|----------|----------|
| `task-exec.prompt.md` | 通用开发、重构、排查 | `/task-exec` |
| `bugfix.prompt.md` | 缺陷修复、回归 | `/bugfix` |
| `review.prompt.md` | 代码评审、风险检查 | `/review` |
| `db-change.prompt.md` | Supabase 迁移、RLS、SQL | `/db-change` |
| `feature-impl.prompt.md` | 新功能、模块扩展 | `/feature-impl` |

---

## 3. 统一执行流程（所有任务必须遵循）

### 步骤 1：任务开始前（强制）

1. **先用 1-2 句话复述目标、约束和预期结果**
2. **调用 Sequential Thinking MCP**（`user-serena` → `initial_instructions`）
   - 即使任务很小，也至少用它明确目标、约束或执行路径
   - 中等及以上复杂度必须用它拆解问题、明确假设、风险和执行顺序
3. **调用 Serena MCP** 做符号级检索、引用关系和精确定位
   - 若返回 `No active project`，明确说明已降级，退回常规搜索
4. **根据任务类型主动选择合适 skill**

### 步骤 2：建立上下文

- 优先使用 Serena 做符号级检索
- 主动使用 skill（根据任务类型加载）
- 先阅读相关模块、路由、服务层、类型定义和已有相似实现

### 步骤 3：执行前计划

实施前必须说明：
- 涉及文件列表
- 切入点
- 验证方式

### 步骤 4：检查工作区状态

如果要修改已有文件，实施前先检查：
- 该文件当前状态
- 工作区是否已有本地改动
- 若有改动，必须先阅读并在其基础上修改

### 步骤 5：实施时保持改动最小化

- 优先修复根因，不顺手重构无关代码
- 禁止为"做完功能"而顺手改无关模块

### 步骤 6：主动检查联动风险

| 改动类型 | 必须检查的联动项 |
|----------|----------------|
| 字段改动 | 类型、服务层、表格、表单、搜索、详情、导出 |
| Query/Mutation 改动 | queryKey、invalidateQueries、调用点、列表详情联动 |
| 路由/菜单/权限改动 | router、菜单、标题、access 配置 |
| 脚本/配置改动 | README、ENV_SETUP、相关 prompt / instructions |

### 步骤 7：必须验证

| 任务类型 | 最低验证标准 |
|----------|-------------|
| 前端/TS/React | `bun run build` |
| 查询/服务层/Mutation | 构建 + 缓存失效链验证 |
| 路由/表单/权限 | 构建 + 目标页面回归 |
| 数据库变更 | migration 成功 + 查询结果验证 |

若无法完成验证，必须说明阻塞原因、已尝试替代方案和剩余风险。

### 步骤 8：固定汇报结构

完成时必须包含：
1. **完成了什么**（或功能目标）
2. **关键改动**（或关键实现、涉及改动）
3. **验证结果**
4. **风险、限制或下一步**（或剩余限制、风险、后续建议）

---

## 4. Skill 使用约定

| Skill | 适用场景 |
|-------|----------|
| `tanstack-query` | 列表/详情查询、Mutation、缓存失效 |
| `supabase-rls-patterns` | RLS 策略、员工数据隔离、Auth 绑定 |
| `supabase-bulk-operations` | Excel 导入、批量 upsert、数据修复 |
| `business-rules-engine` | 状态流转、工时/成本计算、编辑约束 |
| `mobile-responsive-patterns` | 手机端、H5、响应式页面 |

---

## 5. 数据库变更规范

### 两类执行路径

| 类型 | 工具 | 路径 |
|------|------|------|
| DDL/RLS/约束/索引/函数/触发器 | MCP `apply_migration` 或 `bun run db:push` | `supabase/migrations/*.sql` |
| 一次性数据修复/只读校验 | MCP `execute_sql` 或 `bun run db:query` | `docs/sql-drafts/*.sql` |

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

## 6. 代码风格（必须遵循）

### 导入顺序

```typescript
// 1. React/框架库
import { useState } from 'react'
// 2. 第三方库
import { App } from 'antd'
// 3. 路径别名导入（@/）
import AddButton from '@/ui/AddButton'
// 4. 相对路径导入
import WorkshopOrderTable from './WorkshopOrderTable'
```

### 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `WorkshopOrderList` |
| Hooks | camelCase 前缀 `use` | `useMutationWithMessage` |
| 类型/接口 | PascalCase 前缀 `I` | `ISyneySpec` |
| 常量 | SCREAMING_SNAKE_CASE | `PDF_CONFIG` |

### 组件结构

```typescript
export interface ComponentProps { ... }
export default function ComponentName() { ... }
```

### 路径别名

```
@/        → src/
@ui/      → src/ui/
@features/→ src/features/
@hooks/   → src/hooks/
@services/→ src/services/
@utils/   → src/utils/
```

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

| 文件 | 说明 |
|------|------|
| `AGENTS.md` | 代码风格指南、导入规范、命名规范 |
| `.github/copilot-instructions.md` | 详细 Copilot 执行规则 |
| `.github/prompts/task-exec.prompt.md` | 通用任务执行（含 19 条详细要求） |
| `.github/prompts/db-change.prompt.md` | 数据库变更流程（含 17 条详细要求） |
| `.github/prompts/feature-impl.prompt.md` | 新功能开发（含 21 条详细要求） |
| `.github/prompts/bugfix.prompt.md` | 缺陷修复流程 |
| `.github/prompts/review.prompt.md` | 代码评审流程 |
| `.github/skills/tanstack-query/` | TanStack Query 专项 skill |
| `.github/skills/supabase-rls-patterns/` | Supabase RLS 专项 skill |
| `.github/skills/supabase-bulk-operations/` | 批量操作专项 skill |
| `.github/skills/business-rules-engine/` | 业务规则专项 skill |
| `docs/Supabase数据库脚本执行说明.md` | 数据库操作规范 |
