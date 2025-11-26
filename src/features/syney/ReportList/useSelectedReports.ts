import { useQuery } from '@tanstack/react-query'

import { getSelectedSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useAppStore } from '@/store'

/**
 * 获取选中的入库单详情（包含明细数据）
 * @param enabled - 是否启用查询（默认false，避免不必要的查询）
 */
export function useSelectedReports(enabled: boolean = false) {
  const { tableSelectedKeys: Nos } = useAppStore()

  const {
    data: selectedMap,
    isLoading: selectedReportsLoading,
    error: selectedReportError,
  } = useQuery({
    queryKey: ['selected-reports', Nos],
    queryFn: () => getSelectedSyneyStoreReports(Nos.map(String)),
    // 只在 enabled=true 且有选中项时才查询
    enabled: enabled && Nos.length > 0,
    // 缓存2分钟，因为这是详情数据，变化频率低
    staleTime: 2 * 60 * 1000,
  })

  if (selectedReportError) {
    console.error(selectedReportError)
    throw new Error('获取选择的入库单失败')
  }

  // console.log(selectedMap)

  return {
    selectedMap,
    selectedReportsLoading,
  }
}
