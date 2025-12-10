import { updatePoItems } from '@/services/apiSyneyPo'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useUpdate() {
  const { mutateAsync: updateItems } = useMutationWithMessage({
    mutationFn: updatePoItems,
    invalidateQueries: [['syney-Po']],
    successMessage: '更新成功',
    errorMessage: '更新失败',
    messageApi: undefined,
    mutationOptions: {
      // 保持 mutateAsync 用法
    },
  })

  return { updateItems }
}
