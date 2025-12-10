import { deleteSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useDeleteReport() {
  const { mutate: deleteReport, isPending: isDeleting } =
    useMutationWithInvalidation({
      mutationFn: deleteSyneyStoreReport,
      invalidateQueries: [['syney-reports']],
    })

  return {
    deleteReport,
    isDeleting,
  }
}
