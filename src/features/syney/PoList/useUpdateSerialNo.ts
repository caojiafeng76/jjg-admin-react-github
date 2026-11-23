import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updateSerialNo as updateSerialNoApi } from '@/services/apiSyneySerialNo'
import { syneyPoKeys } from '../queryKeys'

export function useUpdateSerialNo() {
  const { mutateAsync: updateSerialNo, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updateSerialNoApi,
      invalidateQueries: [syneyPoKeys.serialNumbers()],
    })

  return {
    updateSerialNo,
    isUpdating,
  }
}
