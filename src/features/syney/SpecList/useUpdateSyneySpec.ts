import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { updateSyneySpec as updateSyneySpecApi } from '@services/apiSyneySpecs'

export function useUpdateSyneySpec() {
  const queryClient = useQueryClient()

  const { mutate: updateSyneySpec, isPending: isUpdating } = useMutation({
    mutationFn: updateSyneySpecApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-Specs'],
      })
      message.success('编辑规格成功')
    },

    onError: () => {
      message.error('编辑规格失败')
    },
  })

  return {
    updateSyneySpec,
    isUpdating,
  }
}
