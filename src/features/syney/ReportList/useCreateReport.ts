import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { createSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useCreateReport() {
  const { mutate: createReport, isPending: isCreating }
    = useMutationWithInvalidation({
      mutationFn: createSyneyStoreReport,
      invalidateQueries: [['syney-reports']],
    })

  return { createReport, isCreating }
}
