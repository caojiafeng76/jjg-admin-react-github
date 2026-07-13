import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useAppStore } from '@/store'
import { useMarkReportsStatus } from './useMarkReportsStatus'

export default function ConfirmButton() {
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const { markStatus, isPending } = useMarkReportsStatus()

  return (
    <Button
      type="text"
      loading={isPending}
      onClick={() => {
        markStatus(tableSelectedKeys.map(String), 'confirmed')
      }}
      icon={<CheckCircleIcon className="size-4 text-green-500/80!" />}
    >
      已校对
    </Button>
  )
}
