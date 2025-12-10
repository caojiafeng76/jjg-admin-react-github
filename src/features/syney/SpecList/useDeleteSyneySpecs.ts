import { deleteSyneySpecs as deleteSyneySpecsApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useDeleteSyneySpecs() {
  const { mutate: deleteSyneySpecs, isPending: isDeleting } =
    useMutationWithMessage({
      mutationFn: deleteSyneySpecsApi,
      invalidateQueries: [['syney-Specs']],
      successMessage: '删除成功',
      errorMessage: (err) => (err instanceof Error ? err.message : '删除失败'),
    })

  return {
    deleteSyneySpecs,
    isDeleting,
  }
}
