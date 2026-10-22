import { updateSyneySpec as updateSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

export function useUpdateSyneySpec() {
  const { mutate: updateSyneySpec, isPending: isUpdating }
    = useMutationWithMessage({
      mutationFn: updateSyneySpecApi,
      invalidateQueries: [['syney-Specs']],
      successMessage: feedbackText.updated('踏板规格'),
      errorMessage: error =>
        getUserErrorMessage(error, feedbackText.failed('更新', '踏板规格')),
    })

  return {
    updateSyneySpec,
    isUpdating,
  }
}
