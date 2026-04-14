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

## 注意事项

1. **database.types.ts** 由 Supabase CLI 自动生成，禁止手动修改
2. **环境变量**: `VITE_REACT_APP_SUPABASE_URL` 和 `VITE_REACT_APP_SUPABASE_KEY`
3. **AbortError**: 已在 queryClient 中全局处理，组件无需额外处理
4. **暗色模式**: 同时同步 Ant Design theme 和 Tailwind CSS `dark` class
5. **中文优先**: 错误消息、UI文案使用中文，`errorHandler.ts` 包含英转中映射
6. **PDF 中文字体**: 使用 Google Fonts CDN 动态加载 Noto Sans SC TTF 字体，见 `utils/googleFontLoader.ts`。`initializePDF()` 是异步函数，需要 `await` 调用。字体首次加载后会缓存，后续调用直接使用缓存
