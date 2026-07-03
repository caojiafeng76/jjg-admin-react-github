import { getItemById } from '@/services/apiSyneyPo'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'

export function useItem(validItemIds?: number[]) {
  const { tableSelectedKeys } = useAppStore()
  const id = Number(tableSelectedKeys[0])
  const isSelectedItemInCurrentDetail =
    validItemIds === undefined || validItemIds.includes(id)

  const { data, error, isLoading } = useQuery({
    queryKey: ['item', id],
    enabled: !!id && isSelectedItemInCurrentDetail,
    queryFn: () => getItemById(id),
  })

  return { data, error, isLoading }
}
