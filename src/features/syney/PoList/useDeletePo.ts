import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message, MessageInstance } from 'antd'

import { deletePo as deletePoApi } from '@/services/apiSyneyPos'

export function useDeletePo(messageApi?: MessageInstance) {
  const queryClient = useQueryClient()
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi

  const { mutate: deletePo, isPending: isDeleting } = useMutation({
    mutationFn: deletePoApi,
    onSuccess: () => {
      // 失效列表缓存
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })
      // 失效单条数据缓存
      queryClient.invalidateQueries({
        queryKey: ['po'],
      })
      api.success('删除订单成功')
    },

    onError: (err) => {
      console.error(err)
      api.error('删除订单失败')
    },
  })
  return {
    deletePo,
    isDeleting,
    contextHolder: messageApi ? null : contextHolder,
  }
}
