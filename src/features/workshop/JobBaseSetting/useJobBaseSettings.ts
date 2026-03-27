import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  createJobBaseSetting,
  deleteJobBaseSettings,
  getJobBaseSettings,
  updateJobBaseSetting,
} from '@/services/apiJobBaseSettings'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const JOB_BASE_SETTINGS_KEY = 'job-base-settings' as const
const JOB_BASE_SETTINGS_OPTIONS_KEY = [JOB_BASE_SETTINGS_KEY, 'options'] as const

export function useJobBaseSettingsList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    jobName?: string
  }
}) {
  return useQuery({
    queryKey: [JOB_BASE_SETTINGS_KEY, page, pageSize, searchParams],
    queryFn: () => getJobBaseSettings({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateJobBaseSetting() {
  return useMutationWithInvalidation({
    mutationFn: createJobBaseSetting,
    invalidateQueries: [[JOB_BASE_SETTINGS_KEY], JOB_BASE_SETTINGS_OPTIONS_KEY],
  })
}

export function useUpdateJobBaseSetting() {
  return useMutationWithInvalidation({
    mutationFn: updateJobBaseSetting,
    invalidateQueries: [[JOB_BASE_SETTINGS_KEY], JOB_BASE_SETTINGS_OPTIONS_KEY],
  })
}

export function useDeleteJobBaseSettings() {
  return useMutationWithInvalidation({
    mutationFn: deleteJobBaseSettings,
    invalidateQueries: [[JOB_BASE_SETTINGS_KEY], JOB_BASE_SETTINGS_OPTIONS_KEY],
  })
}