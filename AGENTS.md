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

## 参考文档

- `.github/copilot-instructions.md` - 详细 Copilot 指令
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
