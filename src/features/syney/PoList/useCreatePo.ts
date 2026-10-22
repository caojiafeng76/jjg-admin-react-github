import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { createPo as createPoApi } from '@/services/apiSyneyPos'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'

export function useCreatePo() {
  const { mutateAsync: createPo, isPending: isCreating }
    = useMutationWithMessage({
      mutationFn: createPoApi,
      invalidateQueries: [syneyPoKeys.all],
      successMessage: feedbackText.created('订单'),
      // 失败提示由调用处统一处理（创建流程中还有流水号等其他失败点）
      showErrorMessage: false,
    })

  return { createPo, isCreating }
}
