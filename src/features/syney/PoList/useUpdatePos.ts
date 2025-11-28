import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message, MessageInstance } from 'antd'

import { updatePos as updatePosApi } from '@/services/apiSyneyPos'

export function useUpdatePos(messageApi?: MessageInstance) {
  const queryClient = useQueryClient()
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi

  const { mutate: updatePos, isPending: isUpdating } = useMutation({
    mutationFn: updatePosApi,
    onSuccess: () => {
      // 失效列表缓存
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })
      // 失效单条数据缓存
      queryClient.invalidateQueries({
        queryKey: ['po'],
      })
      api.success('更新成功')
    },
    onError: (err) => {
      api.error(err.message || '更新失败')
    },
  })

  return { updatePos, isUpdating, contextHolder: messageApi ? null : contextHolder }
}
