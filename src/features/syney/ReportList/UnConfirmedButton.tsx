import { XCircleIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useTableSelection } from '../useTableSelection'
import { useMarkReportsStatus } from './useMarkReportsStatus'

export default function UnConfirmedButton() {
  const { tableSelectedKeys } = useTableSelection()
  const { markStatus, isPending } = useMarkReportsStatus()

  return (
    <Button
      type="text"
      icon={<XCircleIcon className="size-4 text-red-500/80!" />}
      onClick={() => {
        markStatus(tableSelectedKeys.map(String), 'unconfirmed')
      }}
      loading={isPending}
    >
      未校对
    </Button>
  )
}
