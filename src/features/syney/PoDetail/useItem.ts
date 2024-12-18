import { getItemById } from '@/services/apiSyneyPo'
import { useStore } from '@/store'
import { useQuery } from '@tanstack/react-query'

export function useItem() {
  const { tableSelectedKeys } = useStore()
  const id = Number(tableSelectedKeys[0])

  const { data, error, isLoading } = useQuery({
    queryKey: ['item', id],
    enabled: !!id,
    queryFn: () => getItemById(id),
  })

  return { data, error, isLoading }
}
