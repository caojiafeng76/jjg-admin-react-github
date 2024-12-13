import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createSyneyStoreReport } from '@/services/apiSyneyStoreReports'
import { message } from 'antd'

export function useCreateReport() {
  const queryClient = useQueryClient()

  const { mutate: createReport, isPending: isCreating } = useMutation({
    mutationFn: createSyneyStoreReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['syney-reports'],
      })

      message.success('创建对账单成功')
    },
    onError: (err) => {
      console.error(err)
      message.error('创建对账单失败')
    },
  })

  return { createReport, isCreating }
}
