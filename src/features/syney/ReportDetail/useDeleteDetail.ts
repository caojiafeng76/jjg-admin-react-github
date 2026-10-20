import { useParams } from 'react-router-dom'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReport'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const { mutate: deleteDetail, isPending: isDeleting } = useMutationWithMessage({
    mutationFn: deleteSyneyStoreReportItems,
    invalidateQueries: [['syney-store-report', reportNo]],
    successMessage: '删除成功',
    errorMessage: err => (err instanceof Error ? err.message : '删除失败'),
    messageApi: undefined,
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
