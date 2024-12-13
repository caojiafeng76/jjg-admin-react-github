import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { deletePo as deletePoApi } from '@/services/apiSyneyPos'

export function useDeletePo() {
  const queryClient = useQueryClient()

  const { mutate: deletePo, isPending: isDeleting } = useMutation({
    mutationFn: deletePoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })
      message.success('删除订单成功')
    },

    onError: (err) => {
      console.error(err)
      message.error('删除订单失败')
    },
  })
  return {
    deletePo,
    isDeleting,
  }
}
