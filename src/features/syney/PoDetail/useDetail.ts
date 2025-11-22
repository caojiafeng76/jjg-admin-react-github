import { getSyneyPoDetail } from '@/services/apiSyneyPo'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

export function useDetail() {
  const { PoId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['syney-Po', PoId],
    queryFn: () => getSyneyPoDetail(PoId || ''),
  })
  console.log(data)

  if (error) {
    console.error(error)
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
