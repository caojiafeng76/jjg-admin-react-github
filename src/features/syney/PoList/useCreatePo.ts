import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { createPo as createPoApi } from '@/services/apiSyneyPos'

export function useCreatePo() {
  const queryClient = useQueryClient()

  const { mutateAsync: createPo, isPending: isCreating } = useMutation({
    mutationFn: createPoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })

      message.success('创建订单成功')
    },
    onError: (err) => {
      console.error(err)
      message.error('创建订单失败')
    },
  })

  return { createPo, isCreating }
}
