import { message } from 'antd'
import { createPo as createPoApi } from '@/services/apiSyneyPos'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useCreatePo(messageApi?: MessageApi) {
  const { mutateAsync: createPo, isPending: isCreating, contextHolder } =
    useMutationWithMessage({
      mutationFn: createPoApi,
      invalidateQueries: [['syney-pos'], ['serialNo']],
      successMessage: '创建订单成功',
      errorMessage: '创建订单失败',
      messageApi,
      mutationOptions: {
        // 保持原有的 mutateAsync 行为
      },
    })

  return {
    createPo,
    isCreating,
    contextHolder: messageApi ? null : contextHolder,
  }
}
