import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { importSyneyPurchaseOrder } from '@/services/apiSyneyPurchaseOrder'
import { syneyPoKeys } from '../queryKeys'

export function useCreatePo() {
  const { mutateAsync: createPo, isPending: isCreating }
    = useMutationWithInvalidation({
      mutationFn: importSyneyPurchaseOrder,
      invalidateQueries: [syneyPoKeys.all],
    })

  return { createPo, isCreating }
}
