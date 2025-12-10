import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAppStore } from '@/store'
import { getSelectedPosWithItems } from '@/services/apiSyneyPos'
import { ISyneyItem } from '@/services/types'
import { queryConfig } from '@/config/queryClient'

export function useSelectedPos() {
  const { tableSelectedKeys } = useAppStore()

  const {
    data: selectedMap,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['selected-pos', tableSelectedKeys],
    queryFn: () => getSelectedPosWithItems(tableSelectedKeys.map(Number)),
    enabled: tableSelectedKeys.length > 0,
    ...queryConfig.detail,
  })

  if (error) {
    throw new Error('获取选择的入库单失败')
  }

  // 转换数据结构，避免在消费端重复解析 key
  const selectedPosList = useMemo(() => {
    if (!selectedMap) return []
    const list: {
      key: string
      poInfo: {
        SONo: string
        Spec: string
        EndDate: string
        No: string
        SerialNo: string
        Brand: string
        Technique: string
        Remark: string
      }
      items: ISyneyItem[]
    }[] = []

    selectedMap.forEach((items, key) => {
      const [SONo, Spec, EndDate, No, SerialNo, Brand, Technique, Remark] =
        key.split('~')
      list.push({
        key,
        poInfo: {
          SONo,
          Spec,
          EndDate,
          No,
          SerialNo,
          Brand,
          Technique,
          Remark,
        },
        items,
      })
    })
    return list
  }, [selectedMap])

  return {
    selectedMap,
    selectedPosList,
    isLoading,
  }
}
