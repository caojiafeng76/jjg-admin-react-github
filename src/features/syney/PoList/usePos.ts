import { getSyneyPos } from '@/services/apiSyneyPos'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { message } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { isAbortError, queryConfig } from '@/config/queryClient'

export function usePos() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const Status = searchParams.get('Status') || '全部'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const SONo = searchParams.get('SONo') || undefined

  const {
    data: { syneyPos: pos, count } = { syneyPos: [], count: 0 },
    isFetching,
    error,
  } = useQuery({
    queryKey: ['syney-pos', page, pageSize, Status, startDate, endDate, SONo],
    queryFn: ({ signal }) =>
      getSyneyPos({ page, pageSize, Status, startDate, endDate, SONo, signal }),
    // 使用列表查询配置预设
    ...queryConfig.list,
    placeholderData: keepPreviousData,
  })

  const pageCount = Math.ceil((count || 0) / pageSize)

  // 忽略 AbortError（请求被取消是正常行为，不应该显示错误）
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error('获取订单列表失败，请稍后重试')
    }
  }, [error])

  // 优化预取逻辑:将副作用移到 useEffect 中,避免在渲染阶段执行
  useEffect(() => {
    if (page < pageCount) {
      queryClient.prefetchQuery({
        queryKey: [
          'syney-pos',
          page + 1,
          pageSize,
          Status,
          startDate,
          endDate,
          SONo,
        ],
        queryFn: () =>
          getSyneyPos({
            page: page + 1,
            pageSize,
            Status,
            startDate,
            endDate,
            SONo,
          }),
      })
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: [
          'syney-pos',
          page - 1,
          pageSize,
          Status,
          startDate,
          endDate,
          SONo,
        ],
        queryFn: () =>
          getSyneyPos({
            page: page - 1,
            pageSize,
            Status,
            startDate,
            endDate,
            SONo,
          }),
      })
    }
  }, [page, pageCount, pageSize, Status, startDate, endDate, SONo, queryClient])

  return {
    pos,
    count,
    isLoading: isFetching,
    error,
  }
}
