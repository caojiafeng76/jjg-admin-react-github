import { useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReport'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const queryClient = useQueryClient()

  const { mutate: deleteDetail, isPending: isDeleting } = useMutation({
    mutationFn: deleteSyneyStoreReportItems,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-store-report', reportNo],
      })
      message.success('删除成功')
    },
    onError: (err) => {
      message.error(err.message)
    },
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
