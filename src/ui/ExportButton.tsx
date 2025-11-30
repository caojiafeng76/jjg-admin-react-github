import { Button } from 'antd'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'

interface Props {
  handleExport: () => void
  disabled?: boolean
  loading?: boolean
  count?: number
  children?: React.ReactNode
}

export default function ExportButton({
  handleExport,
  disabled = false,
  loading = false,
  count,
  children,
}: Props) {
  return (
    <Button
      type="text"
      icon={<ArrowDownTrayIcon className="size-4" />}
      onClick={handleExport}
      disabled={disabled || loading || (count !== undefined && count === 0)}
      loading={loading}
    >
      {children || (
        <>
          导出Excel
          {count !== undefined && count > 0 && (
            <span className="ml-1 text-xs">({count})</span>
          )}
        </>
      )}
    </Button>
  )
}

