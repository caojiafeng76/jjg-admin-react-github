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
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产版本
pnpm lint:fix   # ESLint 自动修复
pnpm format     # Prettier 格式化
```

## 注意事项

1. **database.types.ts** 由 Supabase CLI 自动生成，禁止手动修改
2. **环境变量**: `VITE_REACT_APP_SUPABASE_URL` 和 `VITE_REACT_APP_SUPABASE_KEY`
3. **AbortError**: 已在 queryClient 中全局处理，组件无需额外处理
4. **暗色模式**: 同时同步 Ant Design theme 和 Tailwind CSS `dark` class
5. **中文优先**: 错误消息、UI文案使用中文，`errorHandler.ts` 包含英转中映射
