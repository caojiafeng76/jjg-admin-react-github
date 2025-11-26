import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'

export function useUpdateReports() {
  const queryClient = useQueryClient()

  const { mutate: updateReports, isPending: isUpdating } = useMutation({
    mutationFn: updateSyneyStoreReports,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })
    },
  })

  return {
    updateReports,
    isUpdating,
  }
}
