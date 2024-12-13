import { useQuery } from '@tanstack/react-query'

import { getSelectedSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useStore } from '@/store'

export function useSelectedReports() {
  const { tableSelectedKeys: Nos } = useStore()

  const {
    data: selectedMap,
    isLoading: selectedReportsLoading,
    error: selectedReportError,
  } = useQuery({
    queryKey: ['selected-reports', Nos],
    queryFn: () => getSelectedSyneyStoreReports(Nos.map(String)),
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
