import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { updatePos as updatePosApi } from '@/services/apiSyneyPos'

export function useUpdatePos() {
  const queryClient = useQueryClient()
  const { mutate: updatePos, isPending: isUpdating } = useMutation({
    mutationFn: updatePosApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })
      message.success('更新成功')
    },
    onError: (err) => {
      message.error(err.message)
    },
  })

  return { updatePos, isUpdating }
}
