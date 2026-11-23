import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { createSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { syneyKeys } from '../queryKeys'

export function useCreateReport() {
  const { mutateAsync: createReport, isPending: isCreating }
    = useMutationWithInvalidation({
      mutationFn: createSyneyStoreReport,
      invalidateQueries: [syneyKeys.report.lists()],
    })

  return { createReport, isCreating }
}
