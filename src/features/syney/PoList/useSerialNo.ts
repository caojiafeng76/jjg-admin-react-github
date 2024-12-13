import { getSerialNo } from '@/services/apiSyneySerialNo'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'

export function useSerialNo() {
  const {
    data: serialNo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['serialNo'],
    queryFn: getSerialNo,
  })

  if (error) {
    message.error('Error fetching serial no')
    throw new Error('Error fetching serial no')
  }

  return {
    serialNo,
    isLoading,
    error,
  }
}
