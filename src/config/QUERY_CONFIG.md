# React Query 配置说明

## 概述

本项目使用统一的 React Query 配置，提供更好的性能、错误处理和用户体验。

## 全局配置

全局配置在 `src/config/queryClient.ts` 中定义，包括：

- **默认 staleTime**: 5 分钟（数据在 5 分钟内视为新鲜）
- **默认 gcTime**: 10 分钟（缓存保留时间）
- **重试策略**: 最多重试 2 次，使用指数退避
- **窗口聚焦**: 禁用自动重新获取（避免不必要的请求）
- **AbortError 处理**: 自动忽略请求取消错误

## 查询配置预设

### 列表查询 (`queryConfig.list`)

适用于分页列表数据：

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['my-list', page, pageSize],
  queryFn: () => fetchList({ page, pageSize }),
  placeholderData: keepPreviousData, // 保持上一页数据
  ...queryConfig.list, // staleTime: 30秒, gcTime: 5分钟
})
```

### 详情查询 (`queryConfig.detail`)

适用于单个资源详情：

```typescript
import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['my-detail', id],
  queryFn: () => fetchDetail(id),
  ...queryConfig.detail, // staleTime: 10分钟, gcTime: 30分钟
})
```

### 实时数据查询 (`queryConfig.realtime`)

适用于需要频繁更新的数据：

```typescript
import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['realtime-data'],
  queryFn: () => fetchRealtimeData(),
  ...queryConfig.realtime, // 每 30 秒自动重新获取
})
```

### 静态数据查询 (`queryConfig.static`)

适用于很少变化的数据（如配置、字典等）：

```typescript
import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const { data } = useQuery({
  queryKey: ['static-config'],
  queryFn: () => fetchConfig(),
  ...queryConfig.static, // staleTime: 1小时, gcTime: 24小时
})
```

## 错误处理

### AbortError 处理

所有查询自动忽略 `AbortError`（请求被取消），这是正常行为，不应该作为错误处理。

如果需要手动处理错误：

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

## 最佳实践

### 1. 使用配置预设

优先使用配置预设，而不是手动设置每个选项：

```typescript
// ✅ 推荐
useQuery({
  queryKey: ['list'],
  queryFn: fetchList,
  ...queryConfig.list,
})

// ❌ 不推荐
useQuery({
  queryKey: ['list'],
  queryFn: fetchList,
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
  // ...
})
```

### 2. 列表查询使用 keepPreviousData

对于分页列表，使用 `keepPreviousData` 保持上一页数据，提供更好的用户体验：

```typescript
import { keepPreviousData } from '@tanstack/react-query'

useQuery({
  queryKey: ['list', page],
  queryFn: () => fetchList(page),
  placeholderData: keepPreviousData,
  ...queryConfig.list,
})
```

### 3. 预取下一页数据

在列表查询中，可以预取相邻页面的数据：

```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

const queryClient = useQueryClient()

useEffect(() => {
  if (page < pageCount) {
    queryClient.prefetchQuery({
      queryKey: ['list', page + 1],
      queryFn: () => fetchList(page + 1),
      ...queryConfig.list,
    })
  }
}, [page, pageCount, queryClient])
```

### 4. 变更后刷新查询

在 mutation 成功后，使用 `invalidateQueries` 刷新相关查询：

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['list'] })
  },
})
```

## 性能优化

1. **合理设置 staleTime**: 根据数据更新频率设置，避免不必要的请求
2. **使用 keepPreviousData**: 列表查询时保持上一页数据，减少闪烁
3. **预取相邻页面**: 提升用户体验
4. **禁用窗口聚焦重新获取**: 避免用户切换标签页时触发请求

## 相关文件

- `src/config/queryClient.ts` - 查询配置定义
- `src/App.tsx` - QueryClient 初始化
- `src/utils/errorHandler.ts` - 错误处理工具


