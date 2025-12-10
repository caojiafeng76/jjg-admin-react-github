import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { queryConfig } from '@/config/queryClient'

export function useDetail() {
  const { reportNo } = useParams()

  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useQuery({
    queryKey: ['syney-store-report', reportNo],
    queryFn: () => getSyneyStoreReport(reportNo || ''),
    enabled: !!reportNo,
    ...queryConfig.detail,
  })

  if (reportError) {
    throw new Error('获取入库单详情失败')
  }

  return {
    report,
    reportLoading,
  }
}
