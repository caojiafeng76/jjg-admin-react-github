import { getSyneyPos } from '@/services/apiSyneyPos'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useSearchParams } from 'react-router-dom'

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
    isLoading,
    error,
  } = useQuery({
    queryKey: ['syney-pos', page, pageSize, Status, startDate, endDate, SONo],
    queryFn: () =>
      getSyneyPos({ page, pageSize, Status, startDate, endDate, SONo }),
  })

  if (error) {
    console.error(error)
    message.error('Error fetching syney pos')
  }

  const pageCount = Math.ceil((count || 0) / pageSize)

  if (page < pageCount)
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

  if (page > 1)
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

  return {
    pos,
    count,
    isLoading,
    error,
  }
}
