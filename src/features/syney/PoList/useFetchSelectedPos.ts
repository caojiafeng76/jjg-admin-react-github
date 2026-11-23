import type { Key } from 'react'
import type { SelectedSyneyPoWithItems } from '@/services/apiSyneyPos'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { queryConfig } from '@/config/queryClient'
import { getSelectedPosWithItems } from '@/services/apiSyneyPos'
import { syneyPoKeys } from '../queryKeys'
import { useTableSelection } from '../useTableSelection'

/**
 * 按需拉取当前勾选订单及其明细。
 *
 * 仅在点击打印、导出或生成送货单时通过 `fetchQuery` 触发（复用缓存），
 * 勾选表格行本身不发起任何网络请求，也不在渲染期抛出错误。
 */
export function useFetchSelectedPos() {
  const queryClient = useQueryClient()
  const { tableSelectedKeys } = useTableSelection()

  const fetchSelectedPos = useCallback(
    async (keys: readonly Key[] = tableSelectedKeys): Promise<SelectedSyneyPoWithItems[]> => {
      const numericIds = Array.from(
        new Set(
          keys
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0),
        ),
      )

      if (numericIds.length === 0) {
        return []
      }

      return queryClient.fetchQuery({
        queryKey: syneyPoKeys.selected(numericIds),
        queryFn: ({ signal }) => getSelectedPosWithItems(numericIds, signal),
        ...queryConfig.detail,
      })
    },
    [queryClient, tableSelectedKeys],
  )

  return { fetchSelectedPos }
}
