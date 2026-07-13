import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAppStore } from '@/store'
import { getSelectedPosWithItems } from '@/services/apiSyneyPos'
import { ISyneyItem } from '@/services/types'
import { queryConfig } from '@/config/queryClient'
import { syneyPoKeys } from '../queryKeys'

export function useSelectedPos() {
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)

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
        BorderMaterial: string
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
