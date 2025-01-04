import { getItemById } from '@/services/apiSyneyPo'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'

export function useItem() {
  const { tableSelectedKeys } = useAppStore()
  const id = Number(tableSelectedKeys[0])

  const { data, error, isLoading } = useQuery({
    queryKey: ['item', id],
    enabled: !!id,
    queryFn: () => getItemById(id),
  })

  return { data, error, isLoading }
}
