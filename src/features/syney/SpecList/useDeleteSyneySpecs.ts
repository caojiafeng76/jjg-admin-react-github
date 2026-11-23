import { deleteSyneySpecs as deleteSyneySpecsApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useDeleteSyneySpecs() {
  const { mutateAsync: deleteSyneySpecs, isPending: isDeleting }
    = useMutationWithInvalidation({
      mutationFn: deleteSyneySpecsApi,
      invalidateQueries: [['syney-Specs']],
    })

  return {
    deleteSyneySpecs,
    isDeleting,
  }
}
