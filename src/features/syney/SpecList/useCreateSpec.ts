import { createSyneySpec as createSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

export function useCreateSyneySpec() {
  const { mutate: createSyneySpec, isPending: isCreating }
    = useMutationWithMessage({
      mutationFn: createSyneySpecApi,
      invalidateQueries: [['syney-Specs']],
      successMessage: feedbackText.created('踏板规格'),
      errorMessage: error =>
        getUserErrorMessage(error, feedbackText.failed('创建', '踏板规格')),
    })

  return { createSyneySpec, isCreating }
}
