import { createSyneySpec as createSyneySpecApi } from '@services/apiSyneySpecs'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

export function useCreateSyneySpec() {
  const {
    mutate: createSyneySpec,
    isPending: isCreating,
    contextHolder,
  } = useMutationWithMessage({
    mutationFn: createSyneySpecApi,
    invalidateQueries: [['syney-Specs']],
    successMessage: '创建规格成功',
    errorMessage: '创建规格失败',
  })

  return { createSyneySpec, isCreating, contextHolder }
}
