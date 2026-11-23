import type { Key } from 'react'
import type { ISyneyItem } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { queryConfig } from '@/config/queryClient'
import { getSelectedSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useTableSelection } from '../useTableSelection'

export type SelectedReportsMap = Map<
  string,
  { items: ISyneyItem[], totalAmount: number, createdAt: string }
>

/**
 * 按需拉取当前勾选对账单及其明细。
 *
 * 仅在点击导出 Excel 或打印对账单/汇总单时触发，勾选表格行本身不发请求。
 */
export function useFetchSelectedReports() {
  const queryClient = useQueryClient()
  const { tableSelectedKeys } = useTableSelection()

  const fetchSelectedReports = useCallback(
    async (keys: readonly Key[] = tableSelectedKeys): Promise<SelectedReportsMap> => {
      const reportNos = Array.from(
        new Set(keys.map(String).map(no => no.trim()).filter(Boolean)),
      )

      if (reportNos.length === 0) {
        return new Map()
      }

      return queryClient.fetchQuery({
        queryKey: ['selected-reports', [...reportNos].sort()],
        queryFn: () => getSelectedSyneyStoreReports(reportNos),
        ...queryConfig.detail,
      })
    },
    [queryClient, tableSelectedKeys],
  )

  return { fetchSelectedReports }
}
