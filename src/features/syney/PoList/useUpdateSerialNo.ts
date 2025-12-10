import { updateSerialNo as updateSerialNoApi } from '@/services/apiSyneySerialNo'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useUpdateSerialNo() {
  const { mutate: updateSerialNo, isPending: isUpdating } = useMutationWithMessage({
    mutationFn: updateSerialNoApi,
    invalidateQueries: [['serialNo']],
    // 成功提示保持静默
    successMessage: undefined,
    errorMessage: '更新编号失败',
    messageApi: undefined,
  })

  return {
    updateSerialNo,
    isUpdating,
  }
}
