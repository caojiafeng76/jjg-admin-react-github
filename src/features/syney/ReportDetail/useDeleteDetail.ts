import { useParams } from 'react-router-dom'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReports'
import { syneyKeys } from '../queryKeys'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const { mutateAsync: deleteDetail, isPending: isDeleting } = useMutationWithInvalidation({
    mutationFn: deleteSyneyStoreReportItems,
    invalidateQueries: reportNo
      ? [
          syneyKeys.report.detail(reportNo),
          syneyKeys.report.header(reportNo),
          syneyKeys.report.lists(),
        ]
      : [syneyKeys.report.all],
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
