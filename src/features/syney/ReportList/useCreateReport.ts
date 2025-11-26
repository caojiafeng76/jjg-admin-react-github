import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useCreateReport() {
  const queryClient = useQueryClient()

  const { mutate: createReport, isPending: isCreating } = useMutation({
    mutationFn: createSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })
    },
  })

  return { createReport, isCreating }
}
