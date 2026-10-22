import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { updatePos as updatePosApi } from '@/services/apiSyneyPos'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'

export function useUpdatePos() {
  const { mutate: updatePos, isPending: isUpdating } = useMutationWithMessage({
    mutationFn: updatePosApi,
    invalidateQueries: [syneyPoKeys.all],
    successMessage: (_data, { ids }) =>
      ids.length > 1
        ? feedbackText.batch('更新', '订单', ids.length)
        : feedbackText.updated('订单'),
    errorMessage: error =>
      getUserErrorMessage(error, feedbackText.failed('更新', '订单')),
  })

  return { updatePos, isUpdating }
}
