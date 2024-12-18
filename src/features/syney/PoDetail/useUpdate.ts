import { updatePoItems } from '@/services/apiSyneyPo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

export function useUpdate() {
  const queryClient = useQueryClient()

  const { mutateAsync: updateItems } = useMutation({
    mutationFn: updatePoItems,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-Po'],
      })
    },
    onError: (err) => {
      console.error(err)
      message.error('更新失败')
    },
  })

  return { updateItems }
}
