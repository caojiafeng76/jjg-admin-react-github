import { getSyneySpecs } from '@services/apiSyneySpecs'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useEffect } from 'react'

import { isAbortError, queryConfig } from '@/config/queryClient'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { syneyKeys } from '../queryKeys'

export interface UseSyneySpecsListParams {
  partNo?: string
  page: number
  pageSize: number
  /** 页面已通过 TableState 内联展示错误时传 true，避免重复 toast */
  silentError?: boolean
  enabled?: boolean
}

export function useSyneySpecsList({
  partNo = '',
  page,
  pageSize,
  silentError = false,
  enabled = true,
}: UseSyneySpecsListParams) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const normalizedPartNo = partNo.trim()

  const {
    data: { syneySpecs, count } = { syneySpecs: [], count: 0 },
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: syneyKeys.spec.list({
      partNo: normalizedPartNo,
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getSyneySpecs({
        PartNo: normalizedPartNo,
        page,
        pageSize,
        isAll: false,
        signal,
      }),
    enabled,
    placeholderData: keepPreviousData,
    ...queryConfig.list,
    throwOnError: false,
  })

  useEffect(() => {
    if (error && !silentError && !isAbortError(error)) {
      message.error(getUserErrorMessage(error, '规格列表获取失败，请稍后重试'))
    }
  }, [error, message, silentError])

  const pageCount = Math.ceil((count || 0) / pageSize)

  useEffect(() => {
    if (!enabled || isPlaceholderData) {
      return
    }

    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: syneyKeys.spec.list({
          partNo: normalizedPartNo,
          page: page + 1,
          pageSize,
        }),
        queryFn: ({ signal }) =>
          getSyneySpecs({
            PartNo: normalizedPartNo,
            page: page + 1,
            pageSize,
            isAll: false,
            signal,
          }),
        ...queryConfig.list,
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: syneyKeys.spec.list({
          partNo: normalizedPartNo,
          page: page - 1,
          pageSize,
        }),
        queryFn: ({ signal }) =>
          getSyneySpecs({
            PartNo: normalizedPartNo,
            page: page - 1,
            pageSize,
            isAll: false,
            signal,
          }),
        ...queryConfig.list,
      })
    }
  }, [
    enabled,
    isPlaceholderData,
    normalizedPartNo,
    page,
    pageCount,
    pageSize,
    queryClient,
  ])

  return {
    syneySpecs,
    count,
    isLoading,
    isFetching,
    error,
    refetch,
  }
}

export function useAllSyneySpecs({
  enabled = true,
  silentError = false,
}: {
  /** 下拉选项等无内联错误区域的场景默认通过 toast 提示，传 true 时静默 */
  silentError?: boolean
  enabled?: boolean
} = {}) {
  const { message } = App.useApp()

  const {
    data: { syneySpecs, count } = { syneySpecs: [], count: 0 },
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: syneyKeys.spec.listAll(),
    queryFn: ({ signal }) =>
      getSyneySpecs({
        PartNo: '',
        page: 1,
        pageSize: 10,
        isAll: true,
        signal,
      }),
    enabled,
    ...queryConfig.static,
    throwOnError: false,
  })

  // 下拉选项等无内联错误区域的场景用 toast 提示；忽略 AbortError
  useEffect(() => {
    if (error && !silentError && !isAbortError(error)) {
      message.error(getUserErrorMessage(error, '规格列表获取失败，请稍后重试'))
    }
  }, [error, message, silentError])

  return {
    syneySpecs,
    count,
    isLoading,
    isFetching,
    error,
    refetch,
  }
}
