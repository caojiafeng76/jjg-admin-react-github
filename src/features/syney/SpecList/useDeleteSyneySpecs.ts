import { deleteSyneySpecs as deleteSyneySpecsApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { syneyKeys } from '../queryKeys'

export function useDeleteSyneySpecs() {
  const { mutateAsync: deleteSyneySpecs, isPending: isDeleting }
    = useMutationWithInvalidation({
      mutationFn: deleteSyneySpecsApi,
      invalidateQueries: [syneyKeys.spec.all],
    })

  return {
    deleteSyneySpecs,
    isDeleting,
  }
}
