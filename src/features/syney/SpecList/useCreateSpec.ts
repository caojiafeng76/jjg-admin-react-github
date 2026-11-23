import { createSyneySpec as createSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { syneyKeys } from '../queryKeys'

export function useCreateSyneySpec() {
  const { mutateAsync: createSyneySpec, isPending: isCreating }
    = useMutationWithInvalidation({
      mutationFn: createSyneySpecApi,
      invalidateQueries: [syneyKeys.spec.all],
    })

  return { createSyneySpec, isCreating }
}
