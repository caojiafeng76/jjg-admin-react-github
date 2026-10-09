import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getJintanProfilesInventoryByDataId } from '@/services/apiJintanProfilesInventory'
import { getJintanProfilesStockInList } from '@/services/apiJintanProfilesStockIn'
import { getJintanProfilesStockOutList } from '@/services/apiJintanProfilesStockOut'
import { jintanKeys } from '../queryKeys'

/** 行详情抽屉内出入库记录每页条数 */
export const JINTAN_PROFILES_DETAIL_RECORDS_PAGE_SIZE = 10

/**
 * 单个型材的库存摘要
 *
 * 查询键挂在 `jintan-profiles-inventory` 根下，出入库 mutation 失效库存根后自动刷新。
 */
export function useJintanProfilesInventoryDetail(profileDataId?: string) {
  return useQuery({
    queryKey: jintanKeys.profilesInventory.detail(profileDataId ?? ''),
    queryFn: ({ signal }) =>
      getJintanProfilesInventoryByDataId(profileDataId as string, signal),
    enabled: Boolean(profileDataId),
    // 不抛到 ErrorBoundary，由抽屉内展示错误与重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个型材的入库记录（挂在 `jintan-profiles-stock-in` 根下，沿用现有失效链） */
export function useJintanProfilesStockInRecords({
  inventoryId,
  page,
  pageSize = JINTAN_PROFILES_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.profilesStockIn.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanProfilesStockInList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个型材的出库记录（挂在 `jintan-profiles-stock-out` 根下，沿用现有失效链） */
export function useJintanProfilesStockOutRecords({
  inventoryId,
  page,
  pageSize = JINTAN_PROFILES_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.profilesStockOut.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanProfilesStockOutList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}
