import { useQuery } from '@tanstack/react-query'

import {
  getOperationsByModel,
  getStandardSeconds,
  getModels,
  getSalesOrdersProjectNos,
  getSalesOrderByProjectNo,
  type ProcessStandardMatchLevel,
} from '@/services/apiProcessStandards'
import { queryConfig } from '@/config/queryClient'

const PROCESS_STANDARDS_KEY = 'process-standards' as const

export type { ProcessStandardMatchLevel }

interface ProcessStandardMatchInput {
  model?: string
  length?: number | null
  partNo?: string | null
}

export function useOperationsByModel({
  model,
  length,
  partNo,
}: ProcessStandardMatchInput) {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, 'operations', model, length ?? null, partNo ?? null],
    queryFn: () => getOperationsByModel({ model: model!, length, partNo }),
    enabled: !!model,
    ...queryConfig.list,
  })
}

export function useStandardSeconds(
  model: string | undefined,
  operation: string | undefined,
  options?: Omit<ProcessStandardMatchInput, 'model'>,
) {
  return useQuery({
    queryKey: [
      PROCESS_STANDARDS_KEY,
      'standard-seconds',
      model,
      operation,
      options?.length ?? null,
      options?.partNo ?? null,
    ],
    queryFn: () =>
      getStandardSeconds({
        model: model!,
        operation: operation!,
        length: options?.length,
        partNo: options?.partNo,
      }),
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
