import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { createSyneySpec as createSyneySpecApi } from '@services/apiSyneySpecs'

export function useCreateSyneySpec() {
  const queryClient = useQueryClient()

  const { mutate: createSyneySpec, isPending: isCreating } = useMutation({
    mutationFn: createSyneySpecApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-Specs'],
      })

      message.success('创建规格成功')
    },
    onError: () => {
      message.error('创建规格失败')
    },
  })

  return { createSyneySpec, isCreating }
}
