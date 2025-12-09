import { Button, App } from 'antd'
import { XCircleIcon } from '@heroicons/react/16/solid'
import { useAppStore } from '@/store'
import { useUpdateReports } from './useUpdateReports'

export default function UnConfirmedButton() {
  const { message } = App.useApp()
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()
  const { isUpdating, updateReports } = useUpdateReports()

  return (
    <Button
      type="text"
      icon={<XCircleIcon className="size-4 text-red-500/80!" />}
      onClick={() => {
        if (tableSelectedKeys.length === 0)
          return message.warning('请选择要标记未校对的条目')

        updateReports(
          {
            Nos: tableSelectedKeys.map(String),
            Status: 'unconfirmed',
          },
          {
            onSuccess: () => {
              message.success('标记未校对成功')
              setTableSelectedKeys([])
            },
            onError: (err) => {
              console.error(err)
              message.error('标记未校对失败')
            },
          }
        )
      }}
      loading={isUpdating}
    >
      未校对
    </Button>
  )
}
