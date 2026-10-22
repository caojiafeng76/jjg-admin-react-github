import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { updateSerialNo as updateSerialNoApi } from '@/services/apiSyneySerialNo'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'

export function useUpdateSerialNo() {
  const { mutate: updateSerialNo, isPending: isUpdating }
    = useMutationWithMessage({
      mutationFn: updateSerialNoApi,
      invalidateQueries: [syneyPoKeys.serialNumbers()],
      // 成功提示由调用处（编号设置页）负责
      errorMessage: error =>
        getUserErrorMessage(error, feedbackText.failed('更新', '编号')),
    })

  return {
    updateSerialNo,
    isUpdating,
  }
}
