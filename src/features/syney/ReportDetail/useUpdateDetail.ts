import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updateSyneyStoreReport } from '@/services/apiSyneyStoreReport'

export function useUpdateDetail() {
  const { mutateAsync: updateItem, isPending: isUpdating } = useMutationWithInvalidation({
    mutationFn: updateSyneyStoreReport,
    invalidateQueries: [['syney-store-report']],
  })

  return {
    updateItem,
    isUpdating,
  }
}
