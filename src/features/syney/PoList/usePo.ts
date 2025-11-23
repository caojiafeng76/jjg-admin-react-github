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
    staleTime: 30000, // 30秒内数据视为新鲜
  })

  if (error) {
    console.error(error)
    message.error('获取入库单失败')
  }

  return { data, isLoading }
}
