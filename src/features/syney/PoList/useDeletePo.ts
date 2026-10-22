import { useQueryClient } from '@tanstack/react-query'

import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { deletePo as deletePoApi } from '@/services/apiSyneyPos'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'

export function useDeletePo() {
  const queryClient = useQueryClient()

  const { mutate: deletePo, isPending: isDeleting } = useMutationWithMessage({
    mutationFn: deletePoApi,
    // 列表、单条、选中项缓存统一失效
    invalidateQueries: [syneyPoKeys.all],
    // 自定义成功处理：精确移除已删除的单条缓存
    onSuccess: (result) => {
      if (result?.deletedIds) {
        result.deletedIds.forEach((id) => {
          queryClient.removeQueries({
            queryKey: syneyPoKeys.detail(id),
            exact: true,
          })
        })
      }
    },
    successMessage: result =>
      feedbackText.deleted('订单', result?.deletedCount || 0),
    errorMessage: err =>
      getUserErrorMessage(err, feedbackText.failed('删除', '订单')),
  })

  return { deletePo, isDeleting }
}
