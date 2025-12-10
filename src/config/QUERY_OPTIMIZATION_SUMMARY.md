# React Query 优化总结

## 优化概述

本次优化统一了项目中所有 React Query 查询的配置，提升了性能、错误处理和代码可维护性。

## 优化内容

### 1. 创建统一配置 (`src/config/queryClient.ts`)

- ✅ 全局默认配置
  - `staleTime`: 5 分钟
  - `gcTime`: 10 分钟
  - 智能重试策略（最多 2 次，指数退避）
  - 禁用窗口聚焦自动重新获取
  - 统一 AbortError 处理

- ✅ 查询配置预设
  - `list`: 列表查询配置（30 秒 staleTime）
  - `detail`: 详情查询配置（10 分钟 staleTime）
  - `realtime`: 实时数据配置（自动轮询）
  - `static`: 静态数据配置（1 小时 staleTime）

- ✅ 工具函数
  - `isAbortError()`: 统一判断 AbortError
  - `createQueryClient()`: 创建配置好的 QueryClient

### 2. 更新的文件列表

#### 应用入口
- ✅ `src/App.tsx` - 使用新的 QueryClient 创建函数

#### 列表查询（使用 `queryConfig.list`）
- ✅ `src/features/syney/PoList/usePos.ts`
- ✅ `src/features/syney/ReportList/useReports.ts`
- ✅ `src/features/syney/SpecList/useSyneySpecs.ts`
- ✅ `src/features/workshop/ProductionRecord/useProductionRecords.ts`
- ✅ `src/features/workshop/ProductionRecord/useProductionSheets.ts`
- ✅ `src/features/workshop/EmployeeList/useEmployees.ts`
- ✅ `src/features/workshop/OrderList/useWorkshopOrders.ts`
- ✅ `src/features/workshop/DefectReasonList/useWorkshopDefectReasons.ts`
- ✅ `src/features/workshop/ProcessList/useWorkshopProcesses.ts`

#### 详情查询（使用 `queryConfig.detail`）
- ✅ `src/features/syney/PoList/usePo.ts`
- ✅ `src/features/syney/PoDetail/useDetail.ts`
- ✅ `src/features/syney/ReportDetail/useDetail.ts`
- ✅ `src/features/syney/SpecList/useSyneySpec.ts`
- ✅ `src/features/syney/PoList/useSelectedPos.ts`
- ✅ `src/features/syney/ReportList/useSelectedReports.ts`
- ✅ `src/features/workshop/ProductionRecord/useProductionSheets.ts` (useProductionSheetById)

#### 静态数据查询（使用 `queryConfig.static`）
- ✅ `src/features/syney/PoList/useSerialNo.ts`

## 优化效果

### 性能提升
1. **减少不必要的网络请求**
   - 禁用窗口聚焦时自动重新获取
   - 合理的 staleTime 设置，避免频繁刷新

2. **更好的缓存策略**
   - 列表数据：30 秒缓存
   - 详情数据：10 分钟缓存
   - 静态数据：1 小时缓存

3. **优化用户体验**
   - 使用 `keepPreviousData` 保持上一页数据，减少闪烁
   - 预取相邻页面数据，提升切换速度

### 代码质量提升
1. **统一配置管理**
   - 所有查询配置集中管理
   - 易于维护和调整

2. **统一错误处理**
   - 自动忽略 AbortError（请求取消）
   - 统一的错误提示格式

3. **类型安全**
   - 完整的 TypeScript 类型支持
   - 配置预设类型安全

4. **代码简化**
   - 移除重复的配置代码
   - 使用配置预设，代码更简洁

### 可维护性提升
1. **清晰的文档**
   - `QUERY_CONFIG.md` - 使用说明
   - `QUERY_OPTIMIZATION_SUMMARY.md` - 优化总结

2. **易于扩展**
   - 新增查询类型只需添加配置预设
   - 统一修改配置影响全局

## 使用示例

### 列表查询
```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['my-list', page],
  queryFn: () => fetchList(page),
  placeholderData: keepPreviousData,
  ...queryConfig.list,
})
```

### 详情查询
```typescript
import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['my-detail', id],
  queryFn: () => fetchDetail(id),
  ...queryConfig.detail,
})
```

### 错误处理
```typescript
import { useEffect } from 'react'
import { isAbortError } from '@/config/queryClient'
import { message } from 'antd'

const { error } = useQuery({ ... })

useEffect(() => {
  if (error && !isAbortError(error)) {
    message.error('获取数据失败，请稍后重试')
  }
}, [error])
```

## 后续建议

1. **继续优化其他查询**
   - 检查是否还有未使用新配置的查询 hooks
   - 统一所有查询的错误处理方式

2. **性能监控**
   - 添加查询性能监控
   - 分析缓存命中率

3. **测试**
   - 添加 React Query 相关单元测试
   - 测试不同配置预设的行为

4. **文档完善**
   - 为新团队成员提供使用指南
   - 记录常见问题和解决方案

## 相关文件

- `src/config/queryClient.ts` - 查询配置定义
- `src/config/QUERY_CONFIG.md` - 使用文档
- `src/App.tsx` - QueryClient 初始化


