import { updateSyneySpec as updateSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useUpdateSyneySpec() {
  const { mutate: updateSyneySpec, isPending: isUpdating } =
    useMutationWithMessage({
      mutationFn: updateSyneySpecApi,
      invalidateQueries: [['syney-Specs']],
      successMessage: '编辑规格成功',
      errorMessage: '编辑规格失败',
    })

  return {
    updateSyneySpec,
    isUpdating,
  }
}
