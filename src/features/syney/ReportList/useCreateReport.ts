import { createSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

export function useCreateReport() {
  const { mutate: createReport, isPending: isCreating } =
    useMutationWithInvalidation({
      mutationFn: createSyneyStoreReport,
      invalidateQueries: [['syney-reports']],
    })

  return { createReport, isCreating }
}
