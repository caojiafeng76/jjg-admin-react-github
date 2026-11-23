import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updatePoItems } from '@/services/apiSyneyPo'
import { syneyPoKeys } from '../queryKeys'

export function useUpdate() {
  const { mutateAsync: updateItems, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updatePoItems,
      invalidateQueries: [syneyPoKeys.all],
    })

  return { updateItems, isUpdating }
}
