import { useQueryClient } from '@tanstack/react-query'

import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { deletePo as deletePoApi } from '@/services/apiSyneyPos'
import { syneyPoKeys } from '../queryKeys'

export function useDeletePo() {
  const queryClient = useQueryClient()

  const { mutateAsync: deletePo, isPending: isDeleting } = useMutationWithInvalidation({
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
  })

  return { deletePo, isDeleting }
}
