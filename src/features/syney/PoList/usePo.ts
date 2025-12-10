import getSyneyPo from '@/services/apiSyneyPos'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { useEffect } from 'react'
import { isAbortError, queryConfig } from '@/config/queryClient'

export function usePo() {
  const { tableSelectedKeys } = useAppStore()

  const id = tableSelectedKeys[0] || ''

  const { data, error, isLoading } = useQuery({
    queryKey: ['po', id],
    enabled: !!id,
    queryFn: ({ signal }) => getSyneyPo(id.toString(), signal),
    ...queryConfig.detail,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error('获取入库单失败，请稍后重试')
    }
  }, [error])

  return { data, isLoading }
}
