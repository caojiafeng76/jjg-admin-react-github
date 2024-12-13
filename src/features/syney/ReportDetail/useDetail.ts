import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useDetail() {
  const { reportNo } = useParams()

  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useQuery({
    queryKey: ['syney-store-report', reportNo],
    queryFn: () => getSyneyStoreReport(reportNo || ''),
  })

  if (reportError) {
    console.error(reportError)
    throw new Error('获取入库单详情失败')
  }

  return {
    report,
    reportLoading,
  }
}
