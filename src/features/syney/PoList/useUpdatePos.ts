import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { updatePos as updatePosApi } from '@/services/apiSyneyPos'

export function useUpdatePos() {
  const queryClient = useQueryClient()
  const [messageApi] = message.useMessage()

  const { mutate: updatePos, isPending: isUpdating } = useMutation({
    mutationFn: updatePosApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })
      messageApi.success('更新成功')
    },
    onError: (err) => {
      messageApi.error(err.message || '更新失败')
    },
  })

  return { updatePos, isUpdating }
}
