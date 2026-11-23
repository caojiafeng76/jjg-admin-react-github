import { updateSyneySpec as updateSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useUpdateSyneySpec() {
  const { mutateAsync: updateSyneySpec, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updateSyneySpecApi,
      invalidateQueries: [['syney-Specs']],
    })

  return {
    updateSyneySpec,
    isUpdating,
  }
}
