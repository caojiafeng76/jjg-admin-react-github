import getSyneyPo from '@/services/apiSyneyPos'
import { useStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'

export function usePo() {
  const { tableSelectedKeys } = useStore()

  const id = tableSelectedKeys[0] || ''

  const { data, error, isLoading } = useQuery({
    queryKey: ['po', id],
    enabled: !!id,
    queryFn: () => getSyneyPo(id.toString()),
  })

  if (error) {
    console.error(error)
    message.error('获取入库单失败')
  }

  return { data, isLoading }
}
