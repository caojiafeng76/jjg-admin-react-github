# 代码重构总结

## 重构概述

本次重构主要针对项目中重复的 Mutation hooks 代码，提取公共逻辑，创建可复用的通用 hooks。

## 创建的通用 Hooks

### 1. `useMutationWithInvalidation`

**位置**: `src/hooks/useMutationWithInvalidation.ts`

**功能**: 带查询失效功能的 Mutation Hook，自动在成功时失效指定的查询缓存。

**使用场景**: 不需要消息提示的简单 mutation。

**示例**:
```typescript
const { mutate, isPending } = useMutationWithInvalidation({
  mutationFn: createItem,
  invalidateQueries: [['items']],
})
```

### 2. `useMutationWithMessage`

**位置**: `src/hooks/useMutationWithMessage.ts`

**功能**: 带消息提示和查询失效功能的 Mutation Hook，自动在成功/失败时显示消息并失效查询缓存。

**使用场景**: 需要消息提示的 mutation。

**示例**:
```typescript
const { mutate, isPending, contextHolder } = useMutationWithMessage({
  mutationFn: createItem,
  invalidateQueries: [['items']],
  successMessage: '创建成功',
  errorMessage: '创建失败',
})
```

## 已重构的文件

### 使用 `useMutationWithInvalidation`

- ✅ `src/features/syney/ReportList/useCreateReport.ts`
- ✅ `src/features/syney/ReportList/useUpdateReports.ts`
- ✅ `src/features/workshop/ProductionRecord/useProductionRecords.ts`
  - `useCreateProductionRecord`
  - `useUpdateProductionRecord`
  - `useDeleteProductionRecords`

### 使用 `useMutationWithMessage`

- ✅ `src/features/syney/PoList/useCreatePo.ts`
- ✅ `src/features/syney/PoList/useUpdatePos.ts`
- ✅ `src/features/syney/SpecList/useCreateSpec.ts`
- ✅ `src/features/syney/SpecList/useUpdateSyneySpec.ts`
- ✅ `src/features/syney/SpecList/useDeleteSyneySpecs.ts`

## 重构效果

### 代码减少

**重构前** (示例):
```typescript
export function useCreateReport() {
  const queryClient = useQueryClient()

  const { mutate: createReport, isPending: isCreating } = useMutation({
    mutationFn: createSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })
    },
  })

  return { createReport, isCreating }
}
```

**重构后**:
```typescript
export function useCreateReport() {
  const { mutate: createReport, isPending: isCreating } =
    useMutationWithInvalidation({
      mutationFn: createSyneyStoreReport,
      invalidateQueries: [['syney-reports']],
    })

  return { createReport, isCreating }
}
```

**代码减少**: 约 50% 的代码量

### 统一性提升

1. **统一的错误处理**: 所有 mutation 使用相同的错误处理逻辑
2. **统一的查询失效**: 使用相同的查询失效模式
3. **统一的消息提示**: 使用相同的消息提示格式

### 可维护性提升

1. **集中管理**: 公共逻辑集中在一个地方，易于修改和维护
2. **类型安全**: 完整的 TypeScript 类型支持
3. **易于扩展**: 新增 mutation hooks 时只需调用通用 hook

## 待重构的文件

以下文件仍使用旧的模式，可以继续重构：

- `src/features/syney/PoList/useDeletePo.ts` - 有复杂的删除逻辑，需要特殊处理
- `src/features/syney/PoDetail/useUpdate.ts`
- `src/features/syney/ReportDetail/useUpdateDetail.ts`
- `src/features/syney/ReportDetail/useDeleteDetail.ts`
- `src/features/syney/ReportList/useDeleteReport.ts`
- `src/features/syney/PoList/useUpdateSerialNo.ts`
- `src/features/workshop/EmployeeList/useEmployees.ts`
- `src/features/workshop/OrderList/useWorkshopOrders.ts`
- `src/features/workshop/DefectReasonList/useWorkshopDefectReasons.ts`
- `src/features/workshop/ProcessList/useWorkshopProcesses.ts`
- `src/features/workshop/ProductionRecord/useProductionSheets.ts`

## 使用指南

### 何时使用 `useMutationWithInvalidation`

- 不需要消息提示的 mutation
- 只需要失效查询缓存的简单场景

### 何时使用 `useMutationWithMessage`

- 需要成功/失败消息提示的 mutation
- 需要用户反馈的操作

### 自定义回调

两个 hooks 都支持自定义 `onSuccess` 和 `onError` 回调：

```typescript
const { mutate } = useMutationWithMessage({
  mutationFn: createItem,
  invalidateQueries: [['items']],
  successMessage: '创建成功',
  onSuccess: (data, variables) => {
    // 自定义逻辑
    console.log('Created:', data)
  },
})
```

## 相关文件

- `src/hooks/useMutationWithInvalidation.ts` - 查询失效 Hook
- `src/hooks/useMutationWithMessage.ts` - 消息提示 Hook
- `src/config/queryClient.ts` - React Query 配置


