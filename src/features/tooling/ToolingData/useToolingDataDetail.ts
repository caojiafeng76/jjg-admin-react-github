import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getToolingInventoryByToolingDataId } from '@/services/apiToolingInventory'
import { getToolingStockInList } from '@/services/apiToolingStockIn'
import { getToolingStockOutList } from '@/services/apiToolingStockOut'
import { toolingKeys } from '../queryKeys'

/** 行详情抽屉内出入库记录每页条数 */
export const TOOLING_DETAIL_RECORDS_PAGE_SIZE = 10

/**
 * 单把刀具的库存摘要
 *
 * 查询键挂在 `tooling-inventory` 根下，入库/出库 mutation 失效库存根后自动刷新。
 */
export function useToolingInventoryDetail(toolingDataId?: string) {
  return useQuery({
    queryKey: toolingKeys.inventory.detail(toolingDataId ?? ''),
    queryFn: ({ signal }) =>
      getToolingInventoryByToolingDataId(toolingDataId as string, signal),
    enabled: Boolean(toolingDataId),
    // 不抛到 ErrorBoundary，由抽屉内展示错误与重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单把刀具的入库记录（挂在 `tooling-stock-in` 根下，沿用现有失效链） */
export function useToolingStockInRecords({
  toolingDataId,
  page,
  pageSize = TOOLING_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  toolingDataId: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: toolingKeys.stockIn.byTooling({ toolingDataId, page, pageSize }),
    queryFn: ({ signal }) =>
      getToolingStockInList({ toolingDataId, page, pageSize, signal }),
    enabled: enabled && Boolean(toolingDataId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单把刀具的出库记录（挂在 `tooling-stock-out` 根下，沿用现有失效链） */
export function useToolingStockOutRecords({
  toolingDataId,
  page,
  pageSize = TOOLING_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  toolingDataId: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: toolingKeys.stockOut.byTooling({ toolingDataId, page, pageSize }),
    queryFn: ({ signal }) =>
      getToolingStockOutList({ toolingDataId, page, pageSize, signal }),
    enabled: enabled && Boolean(toolingDataId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}
