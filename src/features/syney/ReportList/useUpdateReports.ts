import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'

export function useUpdateReports() {
  const queryClient = useQueryClient()

  const { mutate: updateReports, isPending: isUpdating } = useMutation({
    mutationFn: updateSyneyStoreReports,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })

      message.success('更新对账单成功')
    },
    onError: (err) => {
      console.error(err)
      message.error('更新对账单失败')
    },
  })

  return {
    updateReports,
    isUpdating,
  }
}
