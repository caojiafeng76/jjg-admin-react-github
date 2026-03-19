import { useQuery } from '@tanstack/react-query'

import {
  getOperationsByModel,
  getStandardSeconds,
  getModels,
  getSalesOrdersProjectNos,
  getSalesOrderByProjectNo,
} from '@/services/apiProcessStandards'
import { queryConfig } from '@/config/queryClient'

const PROCESS_STANDARDS_KEY = 'process-standards' as const

export function useOperationsByModel(model: string | undefined) {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'operations', model],
    queryFn: () => getOperationsByModel(model!),
    enabled: !!model,
    ...queryConfig.list,
  })
}

export function useStandardSeconds(
  model: string | undefined,
  operation: string | undefined,
) {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'standard-seconds', model, operation],
    queryFn: () => getStandardSeconds(model!, operation!),
    enabled: !!model && !!operation,
    ...queryConfig.list,
  })
}

export function useModels() {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'models'],
    queryFn: getModels,
    ...queryConfig.list,
  })
}

export function useSalesOrdersProjectNos() {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'project-nos'],
    queryFn: getSalesOrdersProjectNos,
    ...queryConfig.list,
  })
}

export function useSalesOrderByProjectNo(projectNo: string | undefined) {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'sales-order', projectNo],
    queryFn: () => getSalesOrderByProjectNo(projectNo!),
    enabled: !!projectNo,
    ...queryConfig.list,
  })
}
