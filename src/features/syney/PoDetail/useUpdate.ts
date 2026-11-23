import { useParams } from 'react-router-dom'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { updatePoItems } from '@/services/apiSyneyPos'
import { syneyKeys } from '../queryKeys'

export function useUpdate() {
  const { PoId } = useParams()

  const { mutateAsync: updateItems, isPending: isUpdating }
    = useMutationWithInvalidation({
      mutationFn: updatePoItems,
      invalidateQueries: PoId
        ? [syneyKeys.po.detail(PoId), syneyKeys.po.selections()]
        : [syneyKeys.po.all],
    })

  return { updateItems, isUpdating }
}
