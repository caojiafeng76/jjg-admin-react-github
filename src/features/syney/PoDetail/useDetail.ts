import { getSyneyPoDetail } from '@/services/apiSyneyPo'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryConfig } from '@/config/queryClient'

export function useDetail() {
  const { PoId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['syney-Po', PoId],
    queryFn: () => getSyneyPoDetail(PoId || ''),
    enabled: !!PoId,
    ...queryConfig.detail,
  })

  if (error) {
    throw new Error('获取采购单详情失败')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any)?.items || []

  return {
    items,
    po: data,
    isLoading,
  }
}
