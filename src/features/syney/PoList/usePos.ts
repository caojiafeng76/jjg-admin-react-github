import { getSyneyPos } from '@/services/apiSyneyPos'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useSearchParams } from 'react-router-dom'

export function usePos() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const {
    data: { syneyPos: pos, count } = { syneyPos: [], count: 0 },
    isLoading,
    error,
  } = useQuery({
    queryKey: ['syney-pos', page, pageSize],
    queryFn: () => getSyneyPos({ page, pageSize }),
  })

  if (error) {
    console.error(error)
    message.error('Error fetching syney pos')
  }

  const pageCount = Math.ceil((count || 0) / pageSize)

  if (page < pageCount)
    queryClient.prefetchQuery({
      queryKey: ['syney-pos', page + 1, pageSize],
      queryFn: () => getSyneyPos({ page: page + 1, pageSize }),
    })

  if (page > 1)
    queryClient.prefetchQuery({
      queryKey: ['syney-pos', page - 1, pageSize],
      queryFn: () => getSyneyPos({ page: page - 1, pageSize }),
    })

  return {
    pos,
    count,
    isLoading,
    error,
  }
}
