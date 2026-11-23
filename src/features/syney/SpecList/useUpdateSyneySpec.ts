import { updateSyneySpec as updateSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { syneyKeys } from '../queryKeys'

export function useUpdateSyneySpec() {
  const { mutateAsync: updateSyneySpec, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updateSyneySpecApi,
      invalidateQueries: [syneyKeys.spec.all],
    })

  return {
    updateSyneySpec,
    isUpdating,
  }
}
