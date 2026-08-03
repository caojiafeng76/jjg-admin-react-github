import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import type { ToolingFixtureAction } from './fixtureDomain'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createToolingFixture,
  createToolingFixturesBatch,
  deleteToolingFixtures,
  getToolingFixtureList,
  updateToolingFixture,
} from '@/services/apiToolingFixture'
import {
  deleteToolingFixtureUsageRecords,
  getPublicToolingFixture,
  getToolingFixtureUsageRecords,
  recordPublicToolingFixtureAction,
} from '@/services/apiToolingFixturePublic'
import type {
  ToolingFixture,
  ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'
import { toolingFixtureKeys } from './queryKeys'

export function useToolingFixtureList({
  page,
  pageSize,
  keyword,
  status,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: ToolingFixture['status']
}) {
  return useQuery({
    queryKey: toolingFixtureKeys.list({ page, pageSize, keyword, status }),
    queryFn: ({ signal }) =>
      getToolingFixtureList({ page, pageSize, keyword, status, signal }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateToolingFixture() {
  return useMutationWithInvalidation({
    mutationFn: createToolingFixture,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export function useUpdateToolingFixture() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingFixture,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export function useImportToolingFixtures() {
  return useMutationWithInvalidation({
    mutationFn: createToolingFixturesBatch,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export function useDeleteToolingFixtures() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingFixtures,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export function useToolingFixtureUsageRecords({
  page,
  pageSize,
  action,
}: {
  page: number
  pageSize: number
  action?: ToolingFixtureAction
}) {
  return useQuery({
    queryKey: toolingFixtureKeys.recordList({ page, pageSize, action }),
    queryFn: ({ signal }) =>
      getToolingFixtureUsageRecords({ page, pageSize, action, signal }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useDeleteToolingFixtureUsageRecords() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingFixtureUsageRecords,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export function usePublicToolingFixture(qrToken: string) {
  return useQuery({
    queryKey: toolingFixtureKeys.public(qrToken),
    queryFn: () => getPublicToolingFixture(qrToken),
    enabled: Boolean(qrToken),
    ...queryConfig.detail,
    retry: false,
    throwOnError: false,
  })
}

export function useRecordPublicToolingFixtureAction() {
  return useMutationWithInvalidation({
    mutationFn: recordPublicToolingFixtureAction,
    invalidateQueries: [toolingFixtureKeys.all],
  })
}

export type { ToolingFixtureFormValues }
