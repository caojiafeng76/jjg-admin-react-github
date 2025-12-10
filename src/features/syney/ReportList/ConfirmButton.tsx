import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useAppStore } from '@/store'
import { useMarkReportsStatus } from './useMarkReportsStatus'

export default function ConfirmButton() {
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()
  const { markStatus, isPending } = useMarkReportsStatus()

  return (
    <Button
      type="text"
      loading={isPending}
      onClick={() => {
        markStatus(tableSelectedKeys.map(String), 'confirmed')
        // 清空选中在 Hook 成功回调中完成，这里备用确保状态同步
        if (!isPending) setTableSelectedKeys([])
      }}
      icon={<CheckCircleIcon className="size-4 text-green-500/80!" />}
    >
      已校对
    </Button>
  )
}
