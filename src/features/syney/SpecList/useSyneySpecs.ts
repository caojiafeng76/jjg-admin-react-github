import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { getSyneySpecs } from '@services/apiSyneySpecs'

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
  })

  if (error) {
    console.error(error)
    message.error(error.message)
  }

  const pageCount = Math.ceil((count || 0) / pageSize)

  if (page < pageCount)
    queryClient.prefetchQuery({
      queryKey: ['syney-Specs', PartNo, page + 1, pageSize, isAll],
      queryFn: () => getSyneySpecs({ PartNo, page: page + 1, pageSize, isAll }),
    })

  if (page > 1)
    queryClient.prefetchQuery({
      queryKey: ['syney-Specs', PartNo, page - 1, pageSize, isAll],
      queryFn: () => getSyneySpecs({ PartNo, page: page - 1, pageSize, isAll }),
    })

  return { syneySpecs, isLoading, error, count }
}
