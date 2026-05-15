import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createQualityIssueRecord,
  deleteQualityIssueRecords,
  getQualityIssueRecordById,
  getQualityIssueRecordList,
  getQualityIssueRecordOrderOptions,
  updateQualityIssueRecordAuditStatus,
  updateQualityIssueRecord,
  type QualityIssueRecordSearchParams,
} from '@/services/apiQualityIssueRecords'

const QUALITY_ISSUE_RECORDS_KEY = 'quality-issue-records' as const

export function useQualityIssueRecordList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: QualityIssueRecordSearchParams
}) {
  return useQuery({
    queryKey: [QUALITY_ISSUE_RECORDS_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getQualityIssueRecordList({
        page,
        pageSize,
        ...searchParams,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useQualityIssueRecord(id: string | undefined) {
  return useQuery({
    queryKey: [QUALITY_ISSUE_RECORDS_KEY, id],
    queryFn: () => getQualityIssueRecordById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function useQualityIssueRecordOrderOptions() {
  return useQuery({
    queryKey: [QUALITY_ISSUE_RECORDS_KEY, 'order-options'],
    queryFn: getQualityIssueRecordOrderOptions,
    ...queryConfig.list,
  })
}

export function useCreateQualityIssueRecord() {
  return useMutationWithInvalidation({
    mutationFn: createQualityIssueRecord,
    invalidateQueries: [[QUALITY_ISSUE_RECORDS_KEY]],
  })
}

export function useUpdateQualityIssueRecord() {
  return useMutationWithInvalidation({
    mutationFn: updateQualityIssueRecord,
    invalidateQueries: [[QUALITY_ISSUE_RECORDS_KEY]],
  })
}

export function useUpdateQualityIssueRecordAuditStatus() {
  return useMutationWithInvalidation({
    mutationFn: updateQualityIssueRecordAuditStatus,
    invalidateQueries: [[QUALITY_ISSUE_RECORDS_KEY]],
  })
}

export function useDeleteQualityIssueRecords() {
  return useMutationWithInvalidation({
    mutationFn: deleteQualityIssueRecords,
    invalidateQueries: [[QUALITY_ISSUE_RECORDS_KEY]],
  })
}
