import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { deleteSyneySpecs as deleteSyneySpecsApi } from '@services/apiSyneySpecs'

export function useDeleteSyneySpecs() {
  const queryClient = useQueryClient()

  const { mutate: deleteSyneySpecs, isPending: isDeleting } = useMutation({
    mutationFn: deleteSyneySpecsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-Specs'],
      })
      message.success('删除成功')
    },
    onError: (err) => {
      message.error(err.message)
    },
  })
  return {
    deleteSyneySpecs,
    isDeleting,
  }
}
