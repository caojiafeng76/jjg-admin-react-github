# AGENTS.md - JJG Admin React

## 项目概述

基于 React 19 + TypeScript + Vite 的企业管理后台系统，覆盖"西尼"扶梯踏板、车间生产、优迈库存、别墅梯、质量、工具和权限管理等业务。

**技术栈**: React 19.2, TypeScript 6.0, Vite 8, Ant Design 6, Tailwind CSS 4, TanStack Query 5, Zustand 5, Supabase, React Router 7, Heroicons

---

## 构建与开发命令

```bash
# 开发
bun dev                    # 启动开发服务器

# 构建
bun run build             # TypeScript 编译 + Vite 构建
bun run typecheck         # 仅 TypeScript 类型检查
bun run check:bundle      # 检查构建产物体积预算
bun preview               # 预览生产构建

# 测试
bun run test             # Vitest 单元/组件测试
bun run test:watch        # Vitest 监听模式
bun run test:coverage     # 生成测试覆盖率报告

# 代码质量
bun lint                  # ESLint 检查
bun lint:fix              # ESLint 自动修复
bun format                # Prettier 格式化

# AI / Spec / 数据库工具
bun run ai:doctor          # 检查本地 AI 工具链
bun run graphify:build     # 构建 Graphify 代码索引
bun run graphify:update    # 增量更新 Graphify 代码索引
bun run spec:list          # 查看 Spec Workflow 变更列表
bun run spec:status        # 查看 Spec Workflow 状态
bun run spec:instructions  # 查看 Spec Workflow 指令
bun run db:doctor          # 检查数据库连接与工具状态
bun run db:push            # 推送数据库 migration
bun run db:push:dry-run    # 预览数据库 migration 推送
bun run db:query -- --file <sql-file> # 执行仓库 SQL 查询脚本
bun run db:types           # 根据已连接的 Supabase schema 重新生成数据库类型
```

**注意**: 项目使用 `bun` 作为包管理器。测试框架使用 Vitest + Testing Library + jsdom；运行测试请使用 `bun run test`，不要用 Bun 内置的 `bun test` 代替。

---

## 代码风格指南

### 导入规范

1. **路径别名** (vite.config.ts 配置):
   - `@/` → `src/`
   - `@ui/` → `src/ui/`
   - `@features/` → `src/features/`
   - `@hooks/` → `src/hooks/`
   - `@services/` → `src/services/`
   - `@contexts/` → `src/contexts/`
   - `@pages/` → `src/pages/`
   - `@utils/` → `src/utils/`
   - `@assets/` → `src/assets/`
   - `@syney/` → `src/features/syney/`

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

业务模块按功能域组织在 `src/features/` 下；涉及 CRUD 的模块通常采用以下结构，实际文件以模块现状为准：

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

> **权威规则来源：[.github/copilot-instructions.md](.github/copilot-instructions.md)**。本节不再重复维护完整规则文本，仅保留一句话摘要，避免与权威文档出现内容漂移：
>
> 所有 AI 助手处理本项目任务时，必须遵循 `.github/copilot-instructions.md` 中定义的默认任务执行流程（复述目标 → Sequential Thinking 拆解 → 查找相关 skill → Serena 建立上下文 → 阅读代码 → 最小必要澄清 → 给出计划 → 最小化改动 → 更新根目录 `CHANGELOG.MD` → 按任务类型完成最低验证 → 固定格式汇报）、附加强制规则（禁止盲改覆盖、必须验证、诚实报告验证状态、字段/缓存/路由/业务口径一致性检查等）、任务类型最低验证标准、MCP 与工具优先级约定（Sequential Thinking / Serena / Supabase / Figma）。如果该文档更新，本节无需同步复制，直接以其为准即可。

---

## 参考文档

- `.github/copilot-instructions.md` - **权威**执行规则来源（默认任务流程、附加规则、验证标准、MCP/工具优先级）
- `.github/ai-task-matrix.md` - AI 任务类型分流、必选工具和最低验证矩阵
- `.claude/DEVELOPMENT_WORKFLOW.md` - Claude Code 场景下的执行摘要（内容以上面这份为准，仅做格式适配）
- `.github/prompts/*.prompt.md` - 5 种任务类型 prompt（含更详细的逐条要求）
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
<name>ant-design</name>
<description>Decision guide for antd 6.x, Ant Design Pro 5/ProComponents, Ant Design X v2, and the offline `@ant-design/cli`. Use for component selection, theming/tokens, SSR, a11y, performance, routing/access/CRUD, AI/chat UI patterns, local API lookup, debugging, migration, and usage analysis.</description>
<location>project</location>
</skill>

<skill>
<name>find-skills</name>
<description>Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>graphify</name>
<description>Use when exploring unfamiliar codebases, before searching for code, or after editing files. Builds a structural AST index (classes, functions, imports, call graph) from 12 languages via tree-sitter.</description>
<location>project</location>
</skill>

<skill>
<name>mobile-responsiveness</name>
<description>Build responsive, mobile-first web applications. Use when implementing responsive layouts, touch interactions, mobile navigation, or optimizing for various screen sizes.</description>
<location>project</location>
</skill>

<skill>
<name>query-before-page-edit</name>
<description>强制"先查询、后动手"的页面级工作流。当用户要求写新页面、修改现有页面、在页面中新增/删除/重构功能模块，或调整页面相关的路由/菜单/权限时触发。</description>
<location>project</location>
</skill>

<skill>
<name>supabase-postgres-best-practices</name>
<description>Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.</description>
<location>project</location>
</skill>

<skill>
<name>tailwind-design-system</name>
<description>Build scalable design systems with Tailwind CSS v4, design tokens, component libraries, and responsive patterns.</description>
<location>project</location>
</skill>

<skill>
<name>tanstack-query</name>
<description>Powerful asynchronous state management, server-state utilities, and data fetching for TS/JS, React, Vue, Solid, Svelte & Angular.</description>
<location>project</location>
</skill>

<skill>
<name>using-superpowers</name>
<description>Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions.</description>
<location>project</location>
</skill>

<skill>
<name>vercel-react-best-practices</name>
<description>React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns.</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>project</location>
</skill>

</available_skills>

<!-- SKILLS_TABLE_END -->

</skills_system>
