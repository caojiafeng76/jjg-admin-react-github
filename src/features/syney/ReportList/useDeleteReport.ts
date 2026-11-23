import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { deleteSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useDeleteReport() {
  const { mutateAsync: deleteReport, isPending: isDeleting }
    = useMutationWithInvalidation({
      mutationFn: deleteSyneyStoreReport,
      invalidateQueries: [['syney-reports']],
    })

  return {
    deleteReport,
    isDeleting,
  }
}
