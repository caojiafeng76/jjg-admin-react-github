import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'

import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

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
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const button = (
    <Button
      type="text"
      icon={<ArrowDownTrayIcon className="size-4 text-cyan-600/80!" />}
      onClick={onClick}
      disabled={viewerDenied || disabled}
      loading={loading}
    >
      {children || '下载模板'}
    </Button>
  )

  return viewerDenied ? (
    <Tooltip title={viewerOperationTip}>{button}</Tooltip>
  ) : (
    button
  )
}
