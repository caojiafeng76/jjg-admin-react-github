import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { updatePos as updatePosApi } from '@/services/apiSyneyPos'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useUpdatePos(messageApi?: MessageApi) {
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
