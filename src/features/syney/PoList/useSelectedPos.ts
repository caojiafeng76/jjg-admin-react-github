import { useQuery } from '@tanstack/react-query'

import { useStore } from '@/store'
import { getSelectedPosWithItems } from '@/services/apiSyneyPos'

export function useSelectedPos() {
  const { tableSelectedKeys } = useStore()

  const {
    data: selectedMap,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['selected-pos', tableSelectedKeys],
    queryFn: () => getSelectedPosWithItems(tableSelectedKeys.map(Number)),
  })
  if (error) {
    console.error(error)
    throw new Error('获取选择的入库单失败')
  }

  return {
    selectedMap,
    isLoading,
  }
}
