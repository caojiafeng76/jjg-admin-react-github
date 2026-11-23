import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryConfig } from '@/config/queryClient'
import { getSyneyPoDetail } from '@/services/apiSyneyPo'
import { syneyPoKeys } from '../queryKeys'

export function useDetail() {
  const { PoId } = useParams()

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: syneyPoKeys.detail(PoId || ''),
    queryFn: ({ signal }) => getSyneyPoDetail(PoId || '', signal),
    enabled: !!PoId,
    ...queryConfig.detail,
    throwOnError: false,
  })

  const items = data?.items ?? []

  return {
    items,
    po: data,
    isLoading,
    isFetching,
    error,
    refetch,
  }
}
