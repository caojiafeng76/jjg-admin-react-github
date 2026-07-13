import { useQuery } from '@tanstack/react-query'

import { getSelectedSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useAppStore } from '@/store'
import { queryConfig } from '@/config/queryClient'

/**
 * 获取选中的入库单详情（包含明细数据）
 * @param enabled - 是否启用查询（默认false，避免不必要的查询）
 */
export function useSelectedReports(enabled: boolean = false) {
  const Nos = useAppStore((state) => state.tableSelectedKeys)

  const {
    data: selectedMap,
    isLoading: selectedReportsLoading,
    error: selectedReportError,
  } = useQuery({
    queryKey: ['selected-reports', Nos],
    queryFn: () => getSelectedSyneyStoreReports(Nos.map(String)),
    // 只在 enabled=true 且有选中项时才查询
    enabled: enabled && Nos.length > 0,
    // 使用详情查询配置（详情数据变化频率低）
    ...queryConfig.detail,
  })

  if (selectedReportError) {
    throw new Error('获取选择的入库单失败')
  }

  return {
    selectedMap,
    selectedReportsLoading,
  }
}
