import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

interface Props {
  onClick: () => void
  children?: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

export default function ImportButton({
  onClick,
  children,
  disabled = false,
  loading = false,
}: Props) {
  return (
    <Button
      type="text"
      icon={<ArrowUpTrayIcon className="size-4 text-sky-500/80!" />}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {children || '导入 Excel'}
    </Button>
  )
}
