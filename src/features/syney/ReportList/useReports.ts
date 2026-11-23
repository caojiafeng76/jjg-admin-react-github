import { getSyneyStoreReports } from '@services/apiSyneyStoreReports'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import { queryConfig } from '@/config/queryClient'
import { syneyKeys } from '../queryKeys'

export function useReports() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status') || 'all'
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const {
    isLoading,
    isFetching,
    isPlaceholderData,
    data: { syneyStoreReports: reports, count } = {
      syneyStoreReports: [],
      count: 0,
    },
    error,
    refetch,
  } = useQuery({
    queryKey: syneyKeys.report.list({ status, page, pageSize }),
    queryFn: ({ signal }) =>
      getSyneyStoreReports({ status, page, pageSize, signal }),
    placeholderData: keepPreviousData,
    // 使用列表查询配置预设
    ...queryConfig.list,
    // 错误由页面 TableState 内联展示（含重试），不抛到错误边界
    throwOnError: false,
  })

  const pageCount = Math.ceil((count || 0) / pageSize)

  // 优化预取逻辑：将副作用移到 useEffect 中
  useEffect(() => {
    if (isPlaceholderData) {
      return
    }

    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: syneyKeys.report.list({ status, page: page + 1, pageSize }),
        queryFn: ({ signal }) =>
          getSyneyStoreReports({ status, page: page + 1, pageSize, signal }),
        ...queryConfig.list,
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: syneyKeys.report.list({ status, page: page - 1, pageSize }),
        queryFn: ({ signal }) =>
          getSyneyStoreReports({ status, page: page - 1, pageSize, signal }),
        ...queryConfig.list,
      })
    }
  }, [isPlaceholderData, page, pageCount, pageSize, status, queryClient])

  return {
    isLoading,
    isFetching,
    reports,
    count,
    error,
    refetch,
  }
}
