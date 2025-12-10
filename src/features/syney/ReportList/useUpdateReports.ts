import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useUpdateReports() {
  const { mutate: updateReports, isPending: isUpdating } =
    useMutationWithInvalidation({
      mutationFn: updateSyneyStoreReports,
      invalidateQueries: [['syney-reports']],
    })

  return {
    updateReports,
    isUpdating,
  }
}
