import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryConfig } from '@/config/queryClient'
import {
  getSyneyStoreReport,
  getSyneyStoreReportHeader,
} from '@/services/apiSyneyStoreReports'

export function useDetail() {
  const { reportNo } = useParams()

  const {
    data: report,
    isLoading: reportLoading,
    isFetching: reportFetching,
    error: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ['syney-store-report', reportNo],
    queryFn: () => getSyneyStoreReport(reportNo || ''),
    enabled: !!reportNo,
    ...queryConfig.detail,
    throwOnError: false,
  })

  const {
    data: reportInfo,
    isLoading: reportInfoLoading,
    isFetching: reportInfoFetching,
    error: reportInfoError,
    refetch: refetchInfo,
  } = useQuery({
    queryKey: ['syney-store-report-info', reportNo],
    queryFn: () => getSyneyStoreReportHeader(reportNo || ''),
    enabled: !!reportNo,
    ...queryConfig.detail,
    throwOnError: false,
  })

  const refetch = async () => {
    await Promise.all([refetchReport(), refetchInfo()])
  }

  return {
    report,
    reportInfo,
    reportLoading: reportLoading || reportInfoLoading,
    isFetching: reportFetching || reportInfoFetching,
    error: reportError || reportInfoError,
    refetch,
  }
}
