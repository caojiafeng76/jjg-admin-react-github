import { useParams } from 'react-router-dom'
import { deleteSyneyStoreReportItems } from '@/services/apiSyneyStoreReport'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useDeleteDetail() {
  const { reportNo } = useParams()

  const { mutate: deleteDetail, isPending: isDeleting } = useMutationWithMessage({
    mutationFn: deleteSyneyStoreReportItems,
    invalidateQueries: [['syney-store-report', reportNo]],
    successMessage: '删除成功',
    errorMessage: (err) => (err instanceof Error ? err.message : '删除失败'),
    messageApi: undefined,
  })

  return {
    deleteDetail,
    isDeleting,
  }
}
