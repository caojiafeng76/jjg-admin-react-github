import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useDeleteReport() {
  const queryClient = useQueryClient()

  const { mutate: deleteReport, isPending: isDeleting } = useMutation({
    mutationFn: deleteSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })
    },
  })

  return {
    deleteReport,
    isDeleting,
  }
}
