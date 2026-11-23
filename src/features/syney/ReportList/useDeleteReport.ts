import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { deleteSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { syneyKeys } from '../queryKeys'

export function useDeleteReport() {
  const { mutateAsync: deleteReport, isPending: isDeleting }
    = useMutationWithInvalidation({
      mutationFn: deleteSyneyStoreReport,
      invalidateQueries: [syneyKeys.report.all],
    })

  return {
    deleteReport,
    isDeleting,
  }
}
