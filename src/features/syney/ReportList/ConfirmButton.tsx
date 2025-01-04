import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { Button, message } from 'antd'
import { useUpdateReports } from './useUpdateReports'
import { useAppStore } from '@/store'

export default function ConfirmButton() {
  const { isUpdating, updateReports } = useUpdateReports()

  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  return (
    <Button
      type="text"
      loading={isUpdating}
      onClick={() => {
        if (tableSelectedKeys.length === 0)
          return message.warning('请选择要标记已校对的条目')

        updateReports({
          Nos: tableSelectedKeys.map(String),
          Status: 'confirmed',
        })
        setTableSelectedKeys([])
      }}
      icon={<CheckCircleIcon className="size-4 !text-green-500/80" />}
    >
      已校对
    </Button>
  )
}
