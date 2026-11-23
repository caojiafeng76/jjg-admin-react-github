import { useParams } from 'react-router-dom'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updateSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { syneyKeys } from '../queryKeys'

export function useUpdateDetail() {
  const { reportNo } = useParams()

  const { mutateAsync: updateItem, isPending: isUpdating } = useMutationWithInvalidation({
    mutationFn: updateSyneyStoreReport,
    invalidateQueries: reportNo
      ? [syneyKeys.report.detail(reportNo), syneyKeys.spec.all]
      : [syneyKeys.report.details(), syneyKeys.spec.all],
  })

  return {
    updateItem,
    isUpdating,
  }
}
