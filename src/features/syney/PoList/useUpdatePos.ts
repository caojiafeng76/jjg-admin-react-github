import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updatePos as updatePosApi } from '@/services/apiSyneyPos'
import { syneyPoKeys } from '../queryKeys'

export function useUpdatePos() {
  const { mutateAsync: updatePos, isPending: isUpdating } = useMutationWithInvalidation({
    mutationFn: updatePosApi,
    invalidateQueries: [syneyPoKeys.all],
  })

  return { updatePos, isUpdating }
}
