import type { ISyneyItem } from '@/services/types'
import { useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import { queryConfig } from '@/config/queryClient'
import { getSelectedPosWithItems } from '@/services/apiSyneyPos'
import { syneyPoKeys } from '../queryKeys'
import { useTableSelection } from '../useTableSelection'

export function useSelectedPos() {
  const { tableSelectedKeys } = useTableSelection()

  const {
    data: selectedMap,
    isLoading,
    error,
  } = useQuery({
    queryKey: syneyPoKeys.selected(tableSelectedKeys.map(String)),
    queryFn: () => getSelectedPosWithItems(tableSelectedKeys.map(Number)),
    enabled: tableSelectedKeys.length > 0,
    ...queryConfig.detail,
  })

  if (error) {
    throw new Error('获取选择的入库单失败')
  }

  // 转换数据结构，避免在消费端重复解析 key
  const selectedPosList = useMemo(() => {
    if (!selectedMap)
      return []
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
        BorderMaterial: string
        DeliveryNo: string
      }
      items: ISyneyItem[]
    }[] = []

    selectedMap.forEach((items, key) => {
      const [
        SONo,
        Spec,
        EndDate,
        No,
        SerialNo,
        Brand,
        Technique,
        Remark,
        BorderMaterial,
        DeliveryNo,
      ] = key.split('~')
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
          BorderMaterial: BorderMaterial ?? '橡胶',
          DeliveryNo: DeliveryNo ?? '',
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
