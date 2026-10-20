import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'

export function useUpdateReports() {
  const { mutate: updateReports, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updateSyneyStoreReports,
      invalidateQueries: [['syney-reports']],
    })

  return {
    updateReports,
    isUpdating,
  }
}
