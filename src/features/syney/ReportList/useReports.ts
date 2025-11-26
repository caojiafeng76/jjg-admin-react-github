import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { getSyneyStoreReports } from '@services/apiSyneyStoreReports'

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
    // 缓存5分钟，避免频繁切换页面时重复请求
    staleTime: 5 * 60 * 1000,
  })

  if (error) {
    console.log(error)
    message.error(error.message)
  }

  const pageCount = Math.ceil((count || 0) / pageSize)

  if (page < pageCount)
    queryClient.prefetchQuery({
      queryKey: ['syney-reports', status, page + 1, pageSize],
      queryFn: () => getSyneyStoreReports({ status, page: page + 1, pageSize }),
    })

  if (page > 1)
    queryClient.prefetchQuery({
      queryKey: ['syney-reports', status, page - 1, pageSize],
      queryFn: () => getSyneyStoreReports({ status, page: page - 1, pageSize }),
    })

  return {
    isLoading,
    reports,
    count,
    error,
  }
}
