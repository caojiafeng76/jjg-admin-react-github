import getSyneyPo from '@/services/apiSyneyPos'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'

export function usePo() {
  const { tableSelectedKeys } = useAppStore()

  const id = tableSelectedKeys[0] || ''

  const { data, error, isLoading } = useQuery({
    queryKey: ['po', id],
    enabled: !!id,
    queryFn: ({ signal }) => getSyneyPo(id.toString(), signal),
    // 忽略 AbortError（请求被取消是正常行为）
    throwOnError: (error) => {
      if (
        error &&
        typeof error === 'object' &&
        (('name' in error && error.name === 'AbortError') ||
          ('message' in error &&
            typeof (error as { message: unknown }).message === 'string' &&
            (error as { message: string }).message.includes('aborted')))
      ) {
        return false
      }
      return true
    },
  })

  if (error) {
    const isAbortError =
      error &&
      typeof error === 'object' &&
      (('name' in error && error.name === 'AbortError') ||
        ('message' in error &&
          typeof (error as { message: unknown }).message === 'string' &&
          (error as { message: string }).message.includes('aborted')))

    // 忽略 AbortError（请求被取消是正常行为，不应该显示错误）
    if (!isAbortError) {
      console.error(error)
      message.error('获取入库单失败')
    }
  }

  return { data, isLoading }
}
