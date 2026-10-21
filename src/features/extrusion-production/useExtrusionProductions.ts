import type { ExtrusionProductionFilters, UpsertExtrusionProductionPayload } from '@/services/apiExtrusionProductions'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { ORDER_STATUS_DASHBOARD_KEY } from '@/features/workshop/OrderStatusDashboard/useOrderStatusDashboard'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createExtrusionProduction,
  deleteExtrusionProductions,

  getExtrusionProductionById,
  getExtrusionProductions,
  getExtrusionSalesOrderByProjectNo,
  getExtrusionSalesOrdersProjectNos,
  updateExtrusionProduction,

} from '@/services/apiExtrusionProductions'

export const EXTRUSION_PRODUCTIONS_KEY = 'extrusion-productions' as const

const EXTRUSION_PRODUCTION_INVALIDATE_KEYS = [
  [EXTRUSION_PRODUCTIONS_KEY],
  [ORDER_STATUS_DASHBOARD_KEY],
]

export function useExtrusionProductions({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: ExtrusionProductionFilters
}) {
  return useQuery({
    queryKey: [EXTRUSION_PRODUCTIONS_KEY, page, pageSize, filters],
    queryFn: () => getExtrusionProductions({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useExtrusionProduction(id: string | undefined) {
  return useQuery({
    queryKey: [EXTRUSION_PRODUCTIONS_KEY, id],
    queryFn: () => getExtrusionProductionById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function useExtrusionSalesOrdersProjectNos() {
  return useQuery({
    queryKey: [EXTRUSION_PRODUCTIONS_KEY, 'project-no-options'],
    queryFn: getExtrusionSalesOrdersProjectNos,
    // 生产号选项低变更，长 TTL 缓存；仅在表单打开挂载时刷新（refetchOnMount: 'always'），常驻页面不轮询
    ...queryConfig.static,
    refetchOnMount: 'always',
  })
}

export function useExtrusionSalesOrderByProjectNo(projectNo: string | undefined) {
  return useQuery({
    queryKey: [EXTRUSION_PRODUCTIONS_KEY, 'project-no-detail', projectNo],
    queryFn: () => getExtrusionSalesOrderByProjectNo(projectNo!),
    enabled: !!projectNo,
    ...queryConfig.detail,
  })
}

export function useCreateExtrusionProduction() {
  return useMutationWithInvalidation({
    mutationFn: createExtrusionProduction,
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
  })
}

export function useUpdateExtrusionProduction() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpsertExtrusionProductionPayload
    }) => updateExtrusionProduction({ id, payload }),
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
  })
}

export function useDeleteExtrusionProductions() {
  return useMutationWithInvalidation({
    mutationFn: deleteExtrusionProductions,
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
  })
}
