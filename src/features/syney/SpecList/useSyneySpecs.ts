import { getSyneySpecs } from '@services/apiSyneySpecs'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import { isAbortError, queryConfig } from '@/config/queryClient'
import { getUserErrorMessage } from '@/utils/errorHandler'

export function useSyneySpecs({
  isAll = false,
  silentError = false,
  enabled = true,
}: {
  isAll?: boolean
  /** 页面已通过 TableState 内联展示错误时传 true，避免重复 toast */
  silentError?: boolean
  enabled?: boolean
} = {}) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const PartNo = searchParams.get('PartNo') || ''

  const {
    data: { syneySpecs, count } = { syneySpecs: [], count: 0 },
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: isAll ? ['syney-Specs', 'all'] : ['syney-Specs', PartNo, page, pageSize, false],
    queryFn: () => getSyneySpecs({ PartNo: isAll ? '' : PartNo, page, pageSize, isAll }),
    enabled,
    placeholderData: keepPreviousData,
    ...(isAll ? queryConfig.static : queryConfig.list),
    throwOnError: false,
  })

  // 下拉选项等无内联错误区域的场景用 toast 提示；忽略 AbortError
  useEffect(() => {
    if (error && !silentError && !isAbortError(error)) {
      message.error(getUserErrorMessage(error, '规格列表获取失败，请稍后重试'))
    }
  }, [error, message, silentError])

  const pageCount = Math.ceil((count || 0) / pageSize)

  // 优化预取逻辑：仅在启用的分页列表模式下预取相邻页
  useEffect(() => {
    if (!enabled || isAll || isPlaceholderData) {
      return
    }

    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: ['syney-Specs', PartNo, page + 1, pageSize, false],
        queryFn: () => getSyneySpecs({ PartNo, page: page + 1, pageSize, isAll: false }),
        ...queryConfig.list,
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: ['syney-Specs', PartNo, page - 1, pageSize, false],
        queryFn: () => getSyneySpecs({ PartNo, page: page - 1, pageSize, isAll: false }),
        ...queryConfig.list,
      })
    }
  }, [enabled, isPlaceholderData, page, pageCount, pageSize, PartNo, isAll, queryClient])

  return { syneySpecs, isLoading, isFetching, error, count, refetch }
}
