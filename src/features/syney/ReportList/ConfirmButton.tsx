import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { Button, App } from 'antd'
import { useUpdateReports } from './useUpdateReports'
import { useAppStore } from '@/store'

export default function ConfirmButton() {
  const { message } = App.useApp()
  const { isUpdating, updateReports } = useUpdateReports()

  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  return (
    <Button
      type="text"
      loading={isUpdating}
      onClick={() => {
        if (tableSelectedKeys.length === 0)
          return message.warning('请选择要标记已校对的条目')

        updateReports(
          {
            Nos: tableSelectedKeys.map(String),
            Status: 'confirmed',
          },
          {
            onSuccess: () => {
              message.success('标记已校对成功')
              setTableSelectedKeys([])
            },
            onError: (err) => {
              console.error(err)
              message.error('标记已校对失败')
            },
          }
        )
      }}
      icon={<CheckCircleIcon className="size-4 !text-green-500/80" />}
    >
      已校对
    </Button>
  )
}
