import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { updateSyneyStoreReport } from '@/services/apiSyneyStoreReport'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

export function useUpdateDetail() {
  const { mutate: updateItem, isPending: isUpdating } = useMutationWithMessage({
    mutationFn: updateSyneyStoreReport,
    invalidateQueries: [['syney-store-report']],
    successMessage: feedbackText.updated('对账单明细'),
    errorMessage: error =>
      getUserErrorMessage(error, feedbackText.failed('更新', '对账单明细')),
  })

  return {
    updateItem,
    isUpdating,
  }
}
