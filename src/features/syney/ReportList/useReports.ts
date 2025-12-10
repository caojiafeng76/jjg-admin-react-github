import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { message } from 'antd'
import { useEffect } from 'react'

import { getSyneyStoreReports } from '@services/apiSyneyStoreReports'
import { isAbortError, queryConfig } from '@/config/queryClient'

export function useReports() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status') || 'all'
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const {
    isLoading,
    data: { syneyStoreReports: reports, count } = {
      syneyStoreReports: [],
      count: 0,
    },
    error,
  } = useQuery({
    queryKey: ['syney-reports', status, page, pageSize],
    queryFn: () => getSyneyStoreReports({ status, page, pageSize }),
    placeholderData: keepPreviousData,
    // 使用列表查询配置预设
    ...queryConfig.list,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error('获取对账单列表失败，请稍后重试')
    }
  }, [error])

  const pageCount = Math.ceil((count || 0) / pageSize)

  // 优化预取逻辑：将副作用移到 useEffect 中
  useEffect(() => {
    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: ['syney-reports', status, page + 1, pageSize],
        queryFn: () => getSyneyStoreReports({ status, page: page + 1, pageSize }),
        ...queryConfig.list,
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: ['syney-reports', status, page - 1, pageSize],
        queryFn: () => getSyneyStoreReports({ status, page: page - 1, pageSize }),
        ...queryConfig.list,
      })
    }
  }, [page, pageCount, pageSize, status, queryClient])

  return {
    isLoading,
    reports,
    count,
    error,
  }
}
