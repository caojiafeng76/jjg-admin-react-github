import { message } from 'antd'
import { updatePos as updatePosApi } from '@/services/apiSyneyPos'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { syneyPoKeys } from '../queryKeys'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useUpdatePos(messageApi?: MessageApi) {
  const {
    mutate: updatePos,
    isPending: isUpdating,
    contextHolder,
  } = useMutationWithMessage({
    mutationFn: updatePosApi,
    invalidateQueries: [syneyPoKeys.all],
    successMessage: '更新成功',
    errorMessage: (error) =>
      error instanceof Error ? error.message : '更新失败',
    messageApi,
  })

  return {
    updatePos,
    isUpdating,
    contextHolder: messageApi ? null : contextHolder,
  }
}
