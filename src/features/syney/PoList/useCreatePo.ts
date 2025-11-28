import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message, MessageInstance } from 'antd'
import { createPo as createPoApi } from '@/services/apiSyneyPos'

export function useCreatePo(messageApi?: MessageInstance) {
  const queryClient = useQueryClient()
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi

  const { mutateAsync: createPo, isPending: isCreating } = useMutation({
    mutationFn: createPoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-pos'],
      })

      api.success('创建订单成功')
    },
    onError: (err) => {
      console.error(err)
      api.error('创建订单失败')
    },
  })

  return { createPo, isCreating, contextHolder: messageApi ? null : contextHolder }
}
