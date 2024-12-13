import { message } from 'antd'
import { updateSyneyStoreReport } from '@/services/apiSyneyStoreReport'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateDetail() {
  const queryClient = useQueryClient()
  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: updateSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-store-report'],
      })
      message.success('编辑明细成功')
    },
    onError: () => {
      message.error('编辑明细失败')
    },
  })

  return {
    updateItem,
    isUpdating,
  }
}
