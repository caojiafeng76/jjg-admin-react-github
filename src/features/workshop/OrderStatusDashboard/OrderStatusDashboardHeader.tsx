import { ArrowDownTrayIcon, ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/16/solid'
import { Button, Typography } from 'antd'

const { Title } = Typography

export interface OrderStatusDashboardHeaderProps {
  canExportCurrentPage: boolean
  exportDisabled: boolean
  isExporting: boolean
  isFetching: boolean
  isLoading: boolean
  onExport: () => void
  onPreloadExport: () => void
  onRefetch: () => void
}

export function OrderStatusDashboardHeader({
  canExportCurrentPage,
  exportDisabled,
  isExporting,
  isFetching,
  isLoading,
  onExport,
  onPreloadExport,
  onRefetch,
}: OrderStatusDashboardHeaderProps) {
  const isRefreshing = isFetching && !isLoading

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <DocumentChartBarIcon className="size-4" />
        </div>
        <div>
          <Title
            level={4}
            className="mb-0! text-base! font-semibold! text-slate-800 dark:text-slate-100"
          >
            订单现状
          </Title>
          <p className="mt-0 text-xs text-slate-500 dark:text-slate-400">
            实时监控生产进度与订单状态
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canExportCurrentPage && (
          <Button
            size="small"
            icon={<ArrowDownTrayIcon className="size-3.5" />}
            loading={isExporting}
            disabled={exportDisabled}
            onClick={() => void onExport()}
            onMouseEnter={onPreloadExport}
            onFocus={onPreloadExport}
          >
            导出当前页
          </Button>
        )}

        <Button
          size="small"
          icon={(
            <ArrowPathIcon
              className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          )}
          loading={isRefreshing}
          onClick={() => void onRefetch()}
        >
          刷新
        </Button>
      </div>
    </div>
  )
}
