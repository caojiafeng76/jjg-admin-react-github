import { updateSyneyStoreReport } from '@/services/apiSyneyStoreReport'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useUpdateDetail() {
  const { mutate: updateItem, isPending: isUpdating } = useMutationWithMessage({
    mutationFn: updateSyneyStoreReport,
    invalidateQueries: [['syney-store-report']],
    successMessage: '编辑明细成功',
    errorMessage: '编辑明细失败',
    messageApi: undefined,
  })

  return {
    updateItem,
    isUpdating,
  }
}
