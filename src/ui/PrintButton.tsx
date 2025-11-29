import { Button } from 'antd'
import { PrinterIcon } from '@heroicons/react/16/solid'

interface Props {
  handlePrint: () => void
  disabled?: boolean
  loading?: boolean
  count?: number
  children?: React.ReactNode
}

export default function PrintButton({
  handlePrint,
  disabled = false,
  loading = false,
  count,
  children,
}: Props) {
  return (
    <Button
      type="default"
      icon={<PrinterIcon className="size-4" />}
      onClick={handlePrint}
      disabled={disabled || loading || (count !== undefined && count === 0)}
      loading={loading}
    >
      {children || (
        <>
          打印PDF
          {count !== undefined && count > 0 && (
            <span className="ml-1 text-xs">({count})</span>
          )}
        </>
      )}
    </Button>
  )
}
