import { getSyneyPoDetail } from '@/services/apiSyneyPo'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryConfig } from '@/config/queryClient'
import { syneyPoKeys } from '../queryKeys'

export function useDetail() {
  const { PoId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: syneyPoKeys.detail(PoId || ''),
    queryFn: ({ signal }) => getSyneyPoDetail(PoId || '', signal),
    enabled: !!PoId,
    ...queryConfig.detail,
  })

  if (error) {
    throw new Error('获取采购单详情失败')
  }

  const items = data?.items ?? []

  return {
    items,
    po: data,
    isLoading,
  }
}
