import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { deleteSyneyStoreReport } from '@/services/apiSyneyStoreReports'

export function useDeleteReport() {
  const queryClient = useQueryClient()

  const { mutate: deleteReport, isPending: isDeleting } = useMutation({
    mutationFn: deleteSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })

      message.success('删除对账单成功')
    },
    onError: (err) => {
      console.error(err)
      message.error('删除对账单失败')
    },
  })

  return {
    deleteReport,
    isDeleting,
  }
}
