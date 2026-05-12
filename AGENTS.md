# AGENTS.md - JJG Admin React

## 项目概述

基于 React 19 + TypeScript + Vite 的企业管理后台系统，管理"西尼"扶梯踏板和"车间"生产业务。

**技术栈**: React 19, TypeScript 5.7, Vite 7, Ant Design 6, Tailwind CSS 4, TanStack Query 5, Zustand 5, Supabase

---

## 构建与开发命令

```bash
# 开发
bun dev                    # 启动开发服务器

# 构建
bun run build             # TypeScript 编译 + Vite 构建
bun preview               # 预览生产构建

# 代码质量
bun lint                  # ESLint 检查
bun lint:fix              # ESLint 自动修复
bun format                # Prettier 格式化
```

**注意**: 项目使用 `bun` 作为包管理器。无测试框架配置。

---

## 代码风格指南

### 导入规范

1. **路径别名** (vite.config.ts 配置):
   - `@/` → `src/`
   - `@ui/` → `src/ui/`
   - `@features/` → `src/features/`
   - `@hooks/` → `src/hooks/`
   - `@services/` → `src/services/`
   - `@utils/` → `src/utils/`

2. **导入顺序**:
   ```typescript
   // 1. React/框架库
   import { useState, useCallback } from 'react'
   // 2. 第三方库
   import { App, Modal } from 'antd'
   import dayjs from 'dayjs'
   // 3. 路径别名导入
   import AddButton from '@/ui/AddButton'
   import { useTableHeight } from '@/hooks/useTableHeight'
   // 4. 相对路径导入
   import WorkshopOrderTable from './WorkshopOrderTable'
   ```

### 命名规范

- **组件**: PascalCase (如 `WorkshopOrderList`, `PoTable`)
- **Hooks**: camelCase 前缀 `use` (如 `useMutationWithMessage`, `useTableHeight`)
- **工具函数**: camelCase (如 `handleApiError`, `extractSpecFromItems`)
- **类型/接口**: PascalCase 前缀 `I` (如 `ISyneySpec`, `ISyneyItem`)
- **常量**: SCREAMING_SNAKE_CASE (如 `PDF_CONFIG`)

### TypeScript 规范

- 严格模式启用，显式定义返回类型
- 接口定义在 `types.ts` 或服务层
- 使用 `database.types.ts` (自动生成，禁止手动修改)
- Props 类型命名: `{ComponentName}Props`

### 错误处理

- API 层统一使用 `handleApiError`:
  ```typescript
  import { handleApiError } from '@utils/errorHandler'
  if (error) throw handleApiError(error, '操作失败的中文提示')
  ```
- 用户消息使用中文，开发日志可用英文
- 使用 Ant Design `message` 组件显示用户反馈

### React 模式

1. **Query 缓存策略**:

   ```typescript
   import { queryConfig } from '@/config/queryClient'
   // 列表: staleTime 30秒
   // 详情: staleTime 10分钟
   ```

2. **Mutation 封装**:

   ```typescript
   import { useMutationWithMessage } from '@hooks/useMutationWithMessage'
   const { mutate } = useMutationWithMessage({
     mutationFn: createItem,
     invalidateQueries: [['items']],
     successMessage: '创建成功',
   })
   ```

3. **组件结构**:
   ```typescript
   // 类型定义
   export interface ComponentProps { ... }
   // 默认导出组件
   export default function ComponentName() { ... }
   ```

### 格式化

- 使用 Prettier + prettier-plugin-tailwindcss
- 单引号, 无分号, 2空格缩进
- 行宽 80-100 字符
- 尾部逗号: es5

---

## Feature 模块结构

每个 feature 模块完整 CRUD 结构:

```
FeatureName/
├── index.tsx              # 主容器组件
├── FeatureTable.tsx       # 数据表格
├── FeatureForm.tsx        # 表单
├── FeatureSearch.tsx      # 搜索栏
├── useFeatures.ts         # 列表 query hook
├── useFeature.ts          # 详情 query hook
├── useCreateFeature.ts    # 创建 mutation
├── useUpdateFeature.ts    # 更新 mutation
├── useDeleteFeature.ts    # 删除 mutation
└── CLAUDE.md              # 模块文档(可选)
```

---

## 关键约束

1. **数据库类型**: `src/services/database.types.ts` 由 Supabase CLI 自动生成，禁止手动修改
2. **环境变量**: `VITE_REACT_APP_SUPABASE_URL`, `VITE_REACT_APP_SUPABASE_KEY`
3. **AbortError**: 已在 queryClient 全局处理，组件无需额外处理
4. **暗色模式**: 同步 Ant Design theme 和 Tailwind CSS `dark` class
5. **PDF 中文字体**: 异步加载 Noto Sans SC，使用 `await initializePDF()`

---

## AI 任务执行流程与规则

> 以下规则继承自 `.github/copilot-instructions.md`，所有 AI 助手在处理本项目任务时必须严格遵循。

### 默认任务执行流程

除非用户明确要求只讨论方案、不改代码，否则默认按以下流程处理任务：

1. **复述目标**：先用 1-2 句话复述目标、约束和预期输出
2. **Thinking 工具拆解**：中等及以上复杂度任务，必须先使用 `sequential-thinking` 工具拆解问题、明确假设、风险和执行顺序，再进入实施
3. **查找相关技能**：根据任务类型，查找并阅读适用的 skill（如 `tanstack-query`、`supabase-bulk-operations` 等）。如果某个 skill 明显适用于当前任务，必须先读取 skill 内容并理解其指导，再开始实施，禁止跳过
4. **建立上下文**：优先使用 Serena MCP 做符号级检索、引用关系和定位；若 Serena 当前不可用，再退回文件搜索与文本搜索
5. **阅读相关代码**：先搜索并阅读相关代码、文档或配置，禁止在未建立上下文时直接修改
6. **最少必要澄清**：仅在信息不足以继续时，提出最少必要澄清问题；若可合理决策则直接推进
7. **给出实施计划**：开始实施前给出简短计划，说明将检查哪些文件、准备做什么改动、如何验证
8. **最小化改动**：实施时保持改动最小化，优先修复根因，不顺手重构无关代码
9. **必要验证**：改动后执行必要验证，优先使用与任务匹配的最小验证手段，如类型检查、lint、build、局部回归验证
10. **最终回复必须明确说明**：
   - 完成了什么
   - 关键改动是什么
   - 做了哪些验证
   - 是否存在剩余风险、限制或下一步建议

### 严格执行的附加规则

1. **禁止盲改覆盖**：只要任务会修改代码、配置、脚本、SQL 或指令文件，开始编辑前必须先检查相关文件当前状态；如果工作区已有用户改动，必须先阅读并在其基础上修改
2. **必须验证**：只要任务包含实际改动，实施前必须明确本次准备采用的验证方式；除非是纯文档文本调整，否则不能在未做任何验证的情况下结束任务
3. **诚实报告验证状态**：如果无法完成验证，必须明确写出阻塞原因、已尝试的替代方案，以及当前结果为什么仍然可信；不能把"未验证"包装成"已完成验证"
4. **同步更新文档**：修改 `package.json`、脚本、环境变量、开发流程、MCP 配置或项目指令时，必须同步检查 README、ENV_SETUP、相关 prompt / instructions 是否也需要更新
5. **字段链路一致性**：修改列表、表单、详情、搜索条件、表格列或导入导出字段时，必须显式检查字段在服务层、类型、查询、表格、表单、搜索、详情和导出链路中的一致性，避免只改一半
6. **缓存联动一致性**：修改 Query / Mutation / queryKey / invalidateQueries / 缓存联动时，必须检查相关 hook、调用点和失效键是否一致，避免出现"请求成功但界面不刷新"
7. **路由权限同步**：修改路由、菜单、页面标题、权限或角色判断时，必须同步检查 `router`、`MainMenu`、`AppHeader`、access 配置和受影响页面入口
8. **业务口径一致性**：修改业务规则、状态流转、数量/工时/成本/时长计算时，必须检查写入入口、展示入口和汇总口径是否一致，避免局部修复导致口径分裂
9. **Spec Workflow 阶段判断**：涉及 Spec Workflow 的阶段判断时，统一使用 repo-local CLI wrapper 查询状态，不要从 `.mcp.json`、MCP 可用性、文件目录是否存在或历史对话中自行猜测阶段；在阶段未就绪时不要直接跳到后续阶段

### 任务类型最低验证标准

| 任务类型 | 最低验证要求 |
|---------|-------------|
| 前端 / TypeScript / React 代码改动 | 至少执行一次 `bun run build`、类型检查或等价校验；如果改动影响用户操作流程，尽量补充一次页面或流程级验证 |
| 查询 / 服务层 / Mutation / 缓存相关改动 | 除构建或类型检查外，还应验证关键调用链或缓存失效链是否覆盖到受影响页面 |
| 路由 / 表单 / 列表 / 权限相关改动 | 除构建外，优先补充一次目标页面、关键提交流程或权限边界的回归验证；做不到时要明确说明缺口 |
| 脚本 / CLI / MCP / 配置改动 | 至少执行一次相关命令、dry-run、help、关键字扫描或等价校验，确认改动后的流程仍可用 |
| 数据库变更 | 至少验证 migration / SQL 是否成功执行，以及受影响对象或查询结果是否符合预期；如果用户要求的是"落地执行"，不要只停在写出 SQL |

### MCP 与工具使用约定

- **Sequential Thinking MCP**：所有任务在开始执行前，必须先调用 Sequential Thinking MCP；不要跳过。即使任务很小，也至少要先调用一次，用来明确当前目标、假设或执行路径；复杂任务则必须用它拆解问题、校验假设、分析风险并排序执行步骤
- **Serena MCP**：所有任务建立上下文时，必须先调用 Serena MCP 做符号概览、定义查找、引用分析或精确定位；不要直接跳过 Serena 进入常规搜索。如果 Serena 返回 `No active project`、工具缺失或无法定位目标，仍然视为"已调用 Serena MCP"；此时必须明确说明已降级，再退回常规搜索工具继续推进
- **Skills 优先**：遇到 Query / Mutation、缓存失效、列表详情联动、乐观更新等问题时，优先使用 `tanstack-query` skill；遇到 Supabase RLS、角色隔离、员工数据权限、Auth 绑定时，优先使用 `.github/skills/supabase-rls-patterns/`；遇到 Excel 导入、批量 upsert、数据修复、幂等导入时，优先使用 `.github/skills/supabase-bulk-operations/`；遇到状态流转、工时/成本/数量计算、编辑规则、领域校验时，优先使用 `.github/skills/business-rules-engine/`；遇到员工手机端、H5 页面、扫码流程、触屏交互、响应式改造时，优先使用 `.github/skills/mobile-responsive-patterns/`。如果某个 skill 明显适用于当前任务，先读取 skill，再开始实施，不要跳过

### 工具优先级总原则

- **默认情况下优先使用 CLI 工具**（bun 脚本、Supabase CLI 等）完成；只有当 CLI 无法完成（如连接失败、命令不支持、Docker 不可用等）时，才回退到 MCP 作为补充
- **例外：涉及 Supabase 数据库操作时，优先使用 Supabase MCP**；如果 MCP 无法完成、返回能力不足，或需要复用仓库内既有脚本与流程，再结合 CLI 执行
- **例外：涉及 Figma 设计稿、Figma 链接或 Figma 资源时，直接使用官方 Figma MCP** 获取设计上下文或资源内容，不要先用 CLI、手工转述或截图猜测来替代

### Supabase CLI 与数据库脚本执行约定

- 本仓库的 `supabase start`、`supabase status`、`supabase db reset` 等本地容器模式依赖 Docker Desktop；如果 Docker 未运行或本地 CLI 启动失败，不要把数据库任务卡在本地环境上
- 遇到数据库任务时，优先区分两类执行路径：
  - **DDL / RLS / 约束 / 索引 / 函数 / 触发器** -> 优先 Supabase MCP `apply_migration`；需要复用仓库 migration 流程、补充验证或 MCP 不足时，再结合 `bun run db:push`
  - **一次性数据修复 / 只读校验 / 临时 SQL** -> 优先 Supabase MCP `execute_sql`；需要复用仓库 SQL 文件、批处理脚本或 MCP 不足时，再结合 `bun run db:query -- --file <sql-file>`
- 不要把结构变更直接塞进临时 SQL 裸跑；优先保持 migration 可追踪、可回滚
- 如果本地 Docker 不可用，但远程 linked CLI 或 MCP 可用，应继续推进数据库任务，不要因为 `supabase start` 失败而中断
- 任何涉及数据库删除、清空或重置的危险操作（如 `DELETE`、`DROP`、`TRUNCATE`、`db reset`、批量清理）在真正执行前，必须由用户本人明确确认至少 3 次；未达到 3 次确认前，禁止执行

### Figma 资源使用约定

- 只要任务中出现 Figma 设计稿、Figma URL、Figma 节点、组件映射、设计资源复用或"按设计稿实现"这类需求，优先直接使用官方 Figma MCP
- 先通过 Figma MCP 获取设计上下文、节点信息、截图或 Code Connect 线索，再结合项目现有组件和样式实现，不要脱离设计资源自行猜 UI 细节
- 如果 Figma MCP 当前不可用，再退回图片、描述或代码上下文作为补充，并明确说明已降级

---

## 参考文档

- `.github/copilot-instructions.md` - 详细 Copilot 指令（规则来源）
- `CLAUDE.md` - 项目根目录文档
- `src/services/CLAUDE.md` - Services 模块文档

---

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:

- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:

- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
  </usage>

<available_skills>

<skill>
<name>agent-development</name>
<description>This skill should be used when the user asks to "create an agent", "add an agent", "write a subagent", "agent frontmatter", "when to use description", "agent examples", "agent tools", "agent colors", "autonomous agent", or needs guidance on agent structure, system prompts, triggering conditions, or agent development best practices for Claude Code plugins.</description>
<location>project</location>
</skill>

<skill>
<name>claude-opus-4-5-migration</name>
<description>Migrate prompts and code from Claude Sonnet 4.0, Sonnet 4.5, or Opus 4.1 to Opus 4.5. Use when the user wants to update their codebase, prompts, or API calls to use Opus 4.5. Handles model string updates and prompt adjustments for known Opus 4.5 behavioral differences. Does NOT migrate Haiku 4.5.</description>
<location>project</location>
</skill>

<skill>
<name>command-development</name>
<description>This skill should be used when the user asks to "create a slash command", "add a command", "write a custom command", "define command arguments", "use command frontmatter", "organize commands", "create command with file references", "interactive command", "use AskUserQuestion in command", or needs guidance on slash command structure, YAML frontmatter fields, dynamic arguments, bash execution in commands, user interaction patterns, or command development best practices for Claude Code.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>hook-development</name>
<description>This skill should be used when the user asks to "create a hook", "add a PreToolUse/PostToolUse/Stop hook", "validate tool use", "implement prompt-based hooks", "use ${CLAUDE_PLUGIN_ROOT}", "set up event-driven automation", "block dangerous commands", or mentions hook events (PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit, PreCompact, Notification). Provides comprehensive guidance for creating and implementing Claude Code plugin hooks with focus on advanced prompt-based hooks API.</description>
<location>project</location>
</skill>

<skill>
<name>mcp-integration</name>
<description>This skill should be used when the user asks to "add MCP server", "integrate MCP", "configure MCP in plugin", "use .mcp.json", "set up Model Context Protocol", "connect external service", mentions "${CLAUDE_PLUGIN_ROOT} with MCP", or discusses MCP server types (SSE, stdio, HTTP, WebSocket). Provides comprehensive guidance for integrating Model Context Protocol servers into Claude Code plugins for external tool and service integration.</description>
<location>project</location>
</skill>

<skill>
<name>plugin-settings</name>
<description>This skill should be used when the user asks about "plugin settings", "store plugin configuration", "user-configurable plugin", ".local.md files", "plugin state files", "read YAML frontmatter", "per-project plugin settings", or wants to make plugin behavior configurable. Documents the .claude/plugin-name.local.md pattern for storing plugin-specific configuration with YAML frontmatter and markdown content.</description>
<location>project</location>
</skill>

<skill>
<name>plugin-structure</name>
<description>This skill should be used when the user asks to "create a plugin", "scaffold a plugin", "understand plugin structure", "organize plugin components", "set up plugin.json", "use ${CLAUDE_PLUGIN_ROOT}", "add commands/agents/skills/hooks", "configure auto-discovery", or needs guidance on plugin directory layout, manifest configuration, component organization, file naming conventions, or Claude Code plugin architecture best practices.</description>
<location>project</location>
</skill>

<skill>
<name>skill-development</name>
<description>This skill should be used when the user wants to "create a skill", "add a skill to plugin", "write a new skill", "improve skill description", "organize skill content", or needs guidance on skill structure, progressive disclosure, or skill development best practices for Claude Code plugins.</description>
<location>project</location>
</skill>

<skill>
<name>writing-rules</name>
<description>This skill should be used when the user asks to "create a hookify rule", "write a hook rule", "configure hookify", "add a hookify rule", or needs guidance on hookify rule syntax and patterns.</description>
<location>project</location>
</skill>

</available_skills>

<!-- SKILLS_TABLE_END -->

</skills_system>
