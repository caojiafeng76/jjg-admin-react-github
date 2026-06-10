import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { ORDER_STATUS_DASHBOARD_KEY } from '@/features/workshop/OrderStatusDashboard/useOrderStatusDashboard'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import {
  createExtrusionProduction,
  deleteExtrusionProductions,
  getExtrusionProductionById,
  getExtrusionProductions,
  getExtrusionSalesOrderByProjectNo,
  getExtrusionSalesOrdersProjectNos,
  type ExtrusionProductionFilters,
  type UpsertExtrusionProductionPayload,
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
    ...queryConfig.list,
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
  return useMutationWithMessage({
    mutationFn: createExtrusionProduction,
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
    successMessage: '创建挤压生产单成功',
  })
}

export function useUpdateExtrusionProduction() {
  return useMutationWithMessage({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpsertExtrusionProductionPayload
    }) => updateExtrusionProduction({ id, payload }),
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
    successMessage: '更新挤压生产单成功',
  })
}

export function useDeleteExtrusionProductions() {
  return useMutationWithMessage({
    mutationFn: deleteExtrusionProductions,
    invalidateQueries: EXTRUSION_PRODUCTION_INVALIDATE_KEYS,
    successMessage: '删除挤压生产单成功',
  })
}
