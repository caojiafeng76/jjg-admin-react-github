import { useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { deletePo as deletePoApi } from '@/services/apiSyneyPos'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useDeletePo(messageApi?: MessageApi) {
  const queryClient = useQueryClient()

  const { mutate: deletePo, isPending: isDeleting, contextHolder } =
    useMutationWithMessage({
      mutationFn: deletePoApi,
      // 列表、单条、选中项缓存统一失效
      invalidateQueries: [
        ['syney-pos'],
        ['po'],
        ['selected-pos'],
      ],
      // 自定义成功处理：精确移除已删除的单条缓存
      onSuccess: (result) => {
        if (result?.deletedIds) {
          result.deletedIds.forEach((id) => {
            queryClient.removeQueries({ queryKey: ['po', id.toString()] })
          })
        }
      },
      successMessage: (result) => {
        const count = result?.deletedCount || 0
        return count > 0 ? `成功删除 ${count} 个订单` : '删除订单成功'
      },
      errorMessage: (err) =>
        err instanceof Error ? err.message : '删除订单失败，请稍后重试',
      messageApi,
    })

  return {
    deletePo,
    isDeleting,
    contextHolder: messageApi ? null : contextHolder,
  }
}
