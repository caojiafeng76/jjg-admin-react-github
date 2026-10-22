import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { updatePoItems } from '@/services/apiSyneyPo'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'

export function useUpdate() {
  const { mutateAsync: updateItems, isPending: isUpdating }
    = useMutationWithMessage({
      mutationFn: updatePoItems,
      invalidateQueries: [syneyPoKeys.all],
      successMessage: feedbackText.updated('订单明细'),
      errorMessage: error =>
        getUserErrorMessage(error, feedbackText.failed('更新', '订单明细')),
    })

  return { updateItems, isUpdating }
}
