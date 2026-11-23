import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

export interface OrderStatusDashboardHeaderProps {
  canExportCurrentPage: boolean
  exportDisabled: boolean
  isExporting: boolean
  isRefreshing: boolean
  onExport: () => void
  onPreloadExport: () => void
  onRefetch: () => void
}

export function OrderStatusDashboardHeader({
  canExportCurrentPage,
  exportDisabled,
  isExporting,
  isRefreshing,
  onExport,
  onPreloadExport,
  onRefetch,
}: OrderStatusDashboardHeaderProps) {
  return (
    <div className="ml-2 flex items-center gap-2">
      {canExportCurrentPage && (
        <Button
          icon={<ArrowDownTrayIcon className="size-4" />}
          loading={isExporting}
          disabled={exportDisabled}
          onClick={onExport}
          onMouseEnter={onPreloadExport}
          onFocus={onPreloadExport}
        >
          导出当前页
        </Button>
      )}
      <Button
        icon={<ArrowPathIcon className="size-4" />}
        loading={isRefreshing}
        onClick={onRefetch}
      >
        刷新
      </Button>
    </div>
  )
}
