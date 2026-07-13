import { getItemById } from '@/services/apiSyneyPo'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'

import { syneyPoKeys } from '../queryKeys'

export function useItem(validItemIds?: number[]) {
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const id = Number(tableSelectedKeys[0])
  const isSelectedItemInCurrentDetail =
    validItemIds === undefined || validItemIds.includes(id)

  const { data, error, isLoading } = useQuery({
    queryKey: syneyPoKeys.item(id),
    enabled: !!id && isSelectedItemInCurrentDetail,
    queryFn: () => getItemById(id),
  })

  return { data, error, isLoading }
}
