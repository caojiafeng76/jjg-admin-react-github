import { updateSerialNo as updateSerialNoApi } from '@/services/apiSyneySerialNo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

export function useUpdateSerialNo() {
  const queryClient = useQueryClient()

  const { mutate: updateSerialNo, isPending: isUpdating } = useMutation({
    mutationFn: updateSerialNoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['serialNo'],
      })
      // message.success('更新编号成功')
    },
    onError: (err) => {
      console.error(err)
      message.error('更新编号失败')
    },
  })

  return {
    updateSerialNo,
    isUpdating,
  }
}
