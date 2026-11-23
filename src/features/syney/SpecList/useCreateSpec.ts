import { createSyneySpec as createSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useCreateSyneySpec() {
  const { mutateAsync: createSyneySpec, isPending: isCreating }
    = useMutationWithInvalidation({
      mutationFn: createSyneySpecApi,
      invalidateQueries: [['syney-Specs']],
    })

  return { createSyneySpec, isCreating }
}
