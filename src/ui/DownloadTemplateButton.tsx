import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

interface Props {
  onClick: () => void
  children?: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

export default function DownloadTemplateButton({
  onClick,
  children,
  disabled = false,
  loading = false,
}: Props) {
  return (
    <Button
      type="text"
      icon={<ArrowDownTrayIcon className="size-4 text-cyan-600/80!" />}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {children || '下载模板'}
    </Button>
  )
}
