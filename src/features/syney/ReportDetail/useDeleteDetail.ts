import { useParams } from 'react-router-dom'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReport'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const { mutateAsync: deleteDetail, isPending: isDeleting } = useMutationWithInvalidation({
    mutationFn: deleteSyneyStoreReportItems,
    invalidateQueries: [['syney-store-report', reportNo]],
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
