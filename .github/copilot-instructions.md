# Copilot Instructions - JJG Admin React

## 项目概述

这是一个基于 React 19 + TypeScript + Vite 的企业管理后台系统，主要管理"西尼"（Syney）扶梯踏板和"车间"（Workshop）生产相关业务。

## 技术栈

- **框架**: React 19, TypeScript 5.7, Vite 7
- **UI**: Ant Design 6, Tailwind CSS 4, Heroicons
- **状态管理**: TanStack Query 5 (服务端状态), Zustand 5 (客户端状态)
- **后端**: Supabase (PostgreSQL + Auth)
- **路由**: React Router 7
- **工具**: jsPDF (PDF生成), xlsx (Excel解析)

## 核心架构

### 目录结构模式

```
src/
├── features/           # 业务模块（按功能域组织）
│   ├── syney/          # 西尼业务：PoList, SpecList, ReportList, ReportDetail
│   └── workshop/       # 车间业务：OrderList, ProcessList, EmployeeList
├── services/           # Supabase 数据访问层
├── hooks/              # 共享 React Hooks
├── ui/                 # 通用 UI 组件（非业务）
├── config/             # 全局配置（queryClient 等）
└── store/              # Zustand 全局状态
```

### Feature 模块标准结构

每个 feature 模块包含完整的 CRUD 功能，参考 `src/features/syney/PoList/`：

```
PoList/
├── index.tsx           # 主容器组件（默认导出）
├── PoTable.tsx         # 数据表格
├── PoForm.tsx          # 表单（创建/编辑）
├── usePos.ts           # 列表查询 Hook
├── usePo.ts            # 详情查询 Hook
├── useCreatePo.ts      # 创建 Mutation Hook
├── useDeletePo.ts      # 删除 Mutation Hook
├── useUpdatePos.ts     # 更新 Mutation Hook
└── CLAUDE.md           # 模块文档（可选）
```

## 关键模式

### 1. TanStack Query 使用

使用预设配置，避免重复定义缓存策略：

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

// 列表查询
const { data } = useQuery({
  queryKey: ['syney-pos', { page, pageSize, Status }],
  queryFn: ({ signal }) => getSyneyPos({ page, pageSize, signal }),
  placeholderData: keepPreviousData,
  ...queryConfig.list, // staleTime: 30秒
})

// 详情查询
const { data } = useQuery({
  queryKey: ['syney-po', id],
  queryFn: () => getSyneyPo(id),
  ...queryConfig.detail, // staleTime: 10分钟
})
```

### 2. Mutation 封装 Hook

使用 `useMutationWithMessage` 自动处理消息提示和缓存失效：

```typescript
import { useMutationWithMessage } from '@hooks/useMutationWithMessage'

const { mutate, isPending, contextHolder } = useMutationWithMessage({
  mutationFn: createSyneySpec,
  invalidateQueries: [['syney-specs']],
  successMessage: '创建成功',
  errorMessage: '创建失败',
})
```

### 3. API 服务层模式

所有 Supabase 操作在 `services/` 目录，使用 `handleApiError` 统一错误处理：

```typescript
import { handleApiError } from '@utils/errorHandler'

export async function getSyneySpecs({ PartNo, page, pageSize }) {
  const { data, error, count } = await supabase
    .from('syney-specs')
    .select('*', { count: 'exact' })
    .ilike('PartNo', `%${PartNo}%`)
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '踏板规格列表获取失败')
  return { syneySpecs: data, count }
}
```

### 4. 路径别名

在 `vite.config.ts` 中配置，全项目统一使用：

- `@/` → `src/`
- `@ui/` → `src/ui/`
- `@features/` → `src/features/`
- `@hooks/` → `src/hooks/`
- `@services/` → `src/services/`
- `@utils/` → `src/utils/`

## 开发命令

```bash
bun dev        # 启动开发服务器
bun run build  # 构建生产版本
bun lint:fix   # ESLint 自动修复
bun format     # Prettier 格式化
```

## 默认任务执行流程

除非用户明确要求只讨论方案、不改代码，否则默认按以下流程处理任务：

1. 先用 1-2 句话复述目标、约束和预期输出
2. 中等及以上复杂度任务，必须先使用 thinking 工具拆解问题、明确假设、风险和执行顺序，再进入实施
3. 建立上下文时必须优先使用 Serena 做符号级检索、引用关系和定位；若 Serena 当前不可用，再退回文件搜索与文本搜索
4. 先搜索并阅读相关代码、文档或配置，禁止在未建立上下文时直接修改
5. 仅在信息不足以继续时，提出最少必要澄清问题；若可合理决策则直接推进
6. 开始实施前给出简短计划，说明将检查哪些文件、准备做什么改动、如何验证
7. 实施时保持改动最小化，优先修复根因，不顺手重构无关代码
8. 改动后执行必要验证，优先使用与任务匹配的最小验证手段，如类型检查、lint、build、局部回归验证
9. 最终回复必须明确说明：

- 完成了什么
- 关键改动是什么
- 做了哪些验证
- 是否存在剩余风险、限制或下一步建议

当用户要求“review”时，优先进入代码评审模式：先列问题，再写概述；重点关注缺陷、风险、回归和测试缺口。

关于 Spec Workflow 的状态来源与接入约定：

- 对于会修改应用代码、脚本、SQL、配置或指令文件的任务，默认按 Spec Workflow 的执行顺序推进，除非用户明确要求跳过。
- Spec Workflow 的阶段状态、active change、apply readiness、archive readiness，一律以 repo-local CLI wrapper 输出为准：`bun run spec:list`、`bun run spec -- status --change <name> --json`、`bun run spec -- instructions apply --change <name> --json`。
- `spec-workflow-mcp` 只负责 VS Code MCP 接入、工具暴露与可视化，不作为独立状态来源；不要同时维护一套“按 MCP 判断阶段”和一套“按 openspec CLI 判断阶段”的逻辑。
- 如果 MCP 展示与 CLI wrapper 输出不一致，一律以 CLI wrapper 为准，并提示重新加载 VS Code 窗口或重新连接 MCP。
- 执行顺序固定为：`explore -> propose -> apply -> archive`。
- 需求仍在讨论、范围不清、方案未定时，先走 `explore`，不要直接开始实现。
- 一旦准备写代码，先检查是否已有可继续的 change；若没有，就先通过 `propose` 建立 change 和所需 artifacts，再进入实现。
- 真正写代码时，只在 `apply` 阶段按 tasks 顺序实施；不要跳过 proposal / tasks 直接进入大段实现。
- 任务完成后，如果对应 change 已完成，实现阶段应提示进入 `archive`；不要长期停留在“代码改完但变更未归档”的状态。
- 如果任务非常小或低风险（如单文件小改、文案/说明调整、小范围配置变更），可走最小化实现；但必须在回复中说明本次为何跳过完整 Spec Workflow。
- 如果用户已显式使用 `/opsx:explore`、`/opsx:propose`、`/opsx:apply` 或 `/opsx:archive`，则对应 opsx prompt 视为当前权威流程；其他通用 prompt 和默认流程不再重复做阶段判断或重复查询同一状态。

## 严格执行的附加规则

1. 只要任务会修改代码、配置、脚本、SQL 或指令文件，开始编辑前必须先检查相关文件当前状态；如果工作区已有用户改动，必须先阅读并在其基础上修改，禁止盲改覆盖。
2. 只要任务包含实际改动，实施前必须明确本次准备采用的验证方式；除非是纯文档文本调整，否则不能在未做任何验证的情况下结束任务。
3. 如果无法完成验证，必须明确写出阻塞原因、已尝试的替代方案，以及当前结果为什么仍然可信；不能把“未验证”包装成“已完成验证”。
4. 修改 `package.json`、脚本、环境变量、开发流程、MCP 配置或项目指令时，必须同步检查 README、ENV_SETUP、相关 prompt / instructions 是否也需要更新。
5. 修改列表、表单、详情、搜索条件、表格列或导入导出字段时，必须显式检查字段在服务层、类型、查询、表格、表单、搜索、详情和导出链路中的一致性，避免只改一半。
6. 修改 Query / Mutation / queryKey / invalidateQueries / 缓存联动时，必须检查相关 hook、调用点和失效键是否一致，避免出现“请求成功但界面不刷新”。
7. 修改路由、菜单、页面标题、权限或角色判断时，必须同步检查 `router`、`MainMenu`、`AppHeader`、access 配置和受影响页面入口。
8. 修改业务规则、状态流转、数量/工时/成本/时长计算时，必须检查写入入口、展示入口和汇总口径是否一致，避免局部修复导致口径分裂。
9. 涉及 Spec Workflow 的阶段判断时，统一使用 repo-local CLI wrapper 查询状态，不要从 `.mcp.json`、MCP 可用性、文件目录是否存在或历史对话中自行猜测阶段；在阶段未就绪时不要直接跳到后续阶段。

## 任务类型最低验证标准

- 前端 / TypeScript / React 代码改动：至少执行一次 `bun run build`、类型检查或等价校验；如果改动影响用户操作流程，尽量补充一次页面或流程级验证。
- 查询 / 服务层 / Mutation / 缓存相关改动：除构建或类型检查外，还应验证关键调用链或缓存失效链是否覆盖到受影响页面。
- 路由 / 表单 / 列表 / 权限相关改动：除构建外，优先补充一次目标页面、关键提交流程或权限边界的回归验证；做不到时要明确说明缺口。
- 脚本 / CLI / MCP / 配置改动：至少执行一次相关命令、dry-run、help、关键字扫描或等价校验，确认改动后的流程仍可用。
- 数据库变更：至少验证 migration / SQL 是否成功执行，以及受影响对象或查询结果是否符合预期；如果用户要求的是“落地执行”，不要只停在写出 SQL。

关于 thinking 与 Serena 的使用约定：

- thinking 用于复杂任务的任务拆解、假设校验、风险分析和方案排序；在复杂任务中，应先 thinking，后检索，最后实施
- Serena 用于符号概览、定义查找、引用分析和精确重命名；建立上下文时应先尝试 Serena，再退回常规搜索
- 如果 Serena 出现 `No active project`、工具缺失或无法定位目标，不要卡住，应立即退回常规搜索工具继续推进

关于 skills 的使用约定：

- 遇到 Query / Mutation、缓存失效、列表详情联动、乐观更新等问题时，优先使用 `tanstack-query` skill
- 遇到 Supabase RLS、角色隔离、员工数据权限、Auth 绑定时，优先使用 `.github/skills/supabase-rls-patterns/`
- 遇到 Excel 导入、批量 upsert、数据修复、幂等导入时，优先使用 `.github/skills/supabase-bulk-operations/`
- 遇到状态流转、工时/成本/数量计算、编辑规则、领域校验时，优先使用 `.github/skills/business-rules-engine/`
- 遇到员工手机端、H5 页面、扫码流程、触屏交互、响应式改造时，优先使用 `.github/skills/mobile-responsive-patterns/`
- 如果某个 skill 明显适用于当前任务，先读取 skill，再开始实施，不要跳过

关于工具优先级的总原则：

- **默认情况下优先使用 CLI 工具**（bun 脚本、Supabase CLI 等）完成；只有当 CLI 无法完成（如连接失败、命令不支持、Docker 不可用等）时，才回退到 MCP 作为补充。
- **例外：涉及 Supabase 数据库操作时，优先使用 Supabase MCP**；如果 MCP 无法完成、返回能力不足，或需要复用仓库内既有脚本与流程，再结合 CLI 执行。
- **例外：涉及 Figma 设计稿、Figma 链接或 Figma 资源时，直接使用官方 Figma MCP** 获取设计上下文或资源内容，不要先用 CLI、手工转述或截图猜测来替代。

关于 Supabase CLI 与数据库脚本执行的约定：

- 本仓库的 `supabase start`、`supabase status`、`supabase db reset` 等本地容器模式依赖 Docker Desktop；如果 Docker 未运行或本地 CLI 启动失败，不要把数据库任务卡在本地环境上。
- 遇到数据库任务时，优先区分两类执行路径：
  - DDL / RLS / 约束 / 索引 / 函数 / 触发器 -> 优先 Supabase MCP `apply_migration`；需要复用仓库 migration 流程、补充验证或 MCP 不足时，再结合 `bun run db:push`
  - 一次性数据修复 / 只读校验 / 临时 SQL -> 优先 Supabase MCP `execute_sql`；需要复用仓库 SQL 文件、批处理脚本或 MCP 不足时，再结合 `bun run db:query -- --file <sql-file>`
- 不要把结构变更直接塞进临时 SQL 裸跑；优先保持 migration 可追踪、可回滚。
- 如果本地 Docker 不可用，但远程 linked CLI 或 MCP 可用，应继续推进数据库任务，不要因为 `supabase start` 失败而中断。
- 任何涉及数据库删除、清空或重置的危险操作（如 `DELETE`、`DROP`、`TRUNCATE`、`db reset`、批量清理）在真正执行前，必须由用户本人明确确认至少 3 次；未达到 3 次确认前，禁止执行。

关于 Figma 资源的使用约定：

- 只要任务中出现 Figma 设计稿、Figma URL、Figma 节点、组件映射、设计资源复用或“按设计稿实现”这类需求，优先直接使用官方 Figma MCP。
- 先通过 Figma MCP 获取设计上下文、节点信息、截图或 Code Connect 线索，再结合项目现有组件和样式实现，不要脱离设计资源自行猜 UI 细节。
- 如果 Figma MCP 当前不可用，再退回图片、描述或代码上下文作为补充，并明确说明已降级。

## 注意事项

1. **database.types.ts** 由 Supabase CLI 自动生成，禁止手动修改
2. **环境变量**: `VITE_REACT_APP_SUPABASE_URL` 和 `VITE_REACT_APP_SUPABASE_KEY`
3. **AbortError**: 已在 queryClient 中全局处理，组件无需额外处理
4. **暗色模式**: 同时同步 Ant Design theme 和 Tailwind CSS `dark` class
5. **中文优先**: 错误消息、UI文案使用中文，`errorHandler.ts` 包含英转中映射
6. **PDF 中文字体**: 使用 Google Fonts CDN 动态加载 Noto Sans SC TTF 字体，见 `utils/googleFontLoader.ts`。`initializePDF()` 是异步函数，需要 `await` 调用。字体首次加载后会缓存，后续调用直接使用缓存
