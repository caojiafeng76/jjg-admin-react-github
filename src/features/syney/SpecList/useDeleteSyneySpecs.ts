import { deleteSyneySpecs as deleteSyneySpecsApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

export function useDeleteSyneySpecs() {
  const { mutate: deleteSyneySpecs, isPending: isDeleting }
    = useMutationWithMessage({
      mutationFn: deleteSyneySpecsApi,
      invalidateQueries: [['syney-Specs']],
      successMessage: (_data, ids) => feedbackText.deleted('踏板规格', ids.length),
      errorMessage: err =>
        getUserErrorMessage(err, feedbackText.failed('删除', '踏板规格')),
    })

  return {
    deleteSyneySpecs,
    isDeleting,
  }
}
