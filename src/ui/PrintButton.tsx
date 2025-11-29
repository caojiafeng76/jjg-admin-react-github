import { Button } from 'antd'
import { PrinterIcon } from '@heroicons/react/16/solid'

interface Props {
  onPrint: () => void
  disabled?: boolean
  loading?: boolean
  count?: number
}

export default function PrintButton({
  onPrint,
  disabled = false,
  loading = false,
  count,
}: Props) {
  return (
    <Button
      type="default"
      icon={<PrinterIcon className="size-4" />}
      onClick={onPrint}
      disabled={disabled || loading || (count !== undefined && count === 0)}
      loading={loading}
    >
      打印PDF
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-xs">({count})</span>
      )}
    </Button>
  )
}
