import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { message } from 'antd'
import { useEffect } from 'react'

import { getSyneySpecs } from '@services/apiSyneySpecs'
import { isAbortError, queryConfig } from '@/config/queryClient'

export function useSyneySpecs(
  { isAll }: { isAll: boolean } = { isAll: false },
) {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const PartNo = searchParams.get('PartNo') || ''

  const {
    data: { syneySpecs, count } = { syneySpecs: [], count: 0 },
    isLoading,
    error,
  } = useQuery({
    queryKey: ['syney-Specs', PartNo, page, pageSize, isAll],
    queryFn: () => getSyneySpecs({ PartNo, page, pageSize, isAll }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error('获取规格列表失败，请稍后重试')
    }
  }, [error])

  const pageCount = Math.ceil((count || 0) / pageSize)

  // 优化预取逻辑：将副作用移到 useEffect 中
  useEffect(() => {
    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: ['syney-Specs', PartNo, page + 1, pageSize, isAll],
        queryFn: () => getSyneySpecs({ PartNo, page: page + 1, pageSize, isAll }),
        ...queryConfig.list,
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: ['syney-Specs', PartNo, page - 1, pageSize, isAll],
        queryFn: () => getSyneySpecs({ PartNo, page: page - 1, pageSize, isAll }),
        ...queryConfig.list,
      })
    }
  }, [page, pageCount, pageSize, PartNo, isAll, queryClient])

  return { syneySpecs, isLoading, error, count }
}
