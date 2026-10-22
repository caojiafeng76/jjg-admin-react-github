import { useParams } from 'react-router-dom'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReport'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const { mutate: deleteDetail, isPending: isDeleting } = useMutationWithMessage({
    mutationFn: deleteSyneyStoreReportItems,
    invalidateQueries: [['syney-store-report', reportNo]],
    successMessage: (_data, ids) => feedbackText.deleted('对账单明细', ids.length),
    errorMessage: err =>
      getUserErrorMessage(err, feedbackText.failed('删除', '对账单明细')),
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
