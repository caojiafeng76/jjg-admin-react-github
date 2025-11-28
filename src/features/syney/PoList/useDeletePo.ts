import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message, MessageInstance } from 'antd'

import { deletePo as deletePoApi } from '@/services/apiSyneyPos'

export function useDeletePo(messageApi?: MessageInstance) {
  const queryClient = useQueryClient()
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi

  const { mutate: deletePo, isPending: isDeleting } = useMutation({
    mutationFn: deletePoApi,
    onSuccess: (result) => {
      // 精确失效已删除订单的缓存
      if (result?.deletedIds) {
        result.deletedIds.forEach((id) => {
          queryClient.removeQueries({
            queryKey: ['po', id.toString()],
          })
        })
      }

      // 失效列表缓存
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
        exact: false,
      })

      // 失效单条数据缓存
      queryClient.invalidateQueries({
        queryKey: ['po'],
        exact: false,
      })

      // 显示详细的成功信息
      const count = result?.deletedCount || 0
      if (count > 0) {
        api.success(`成功删除 ${count} 个订单`)
      } else {
        api.success('删除订单成功')
      }
    },

    onError: (err: Error) => {
      console.error('删除订单失败:', err)

      // 显示更详细的错误信息
      let errorMessage = '删除订单失败，请稍后重试'
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      api.error(errorMessage)
    },
  })
  return {
    deletePo,
    isDeleting,
    contextHolder: messageApi ? null : contextHolder,
  }
}
