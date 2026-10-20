import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/16/solid'
import { Button, Typography } from 'antd'

const { Title } = Typography

export interface OrderStatusDashboardHeaderProps {
  canExportCurrentFilters: boolean
  exportDisabled: boolean
  isExporting: boolean
  isFetching: boolean
  isLoading: boolean
  onExport: () => void
  onPreloadExport: () => void
  onRefetch: () => void
  onToggleKpis: () => void
  showKpis: boolean
}

export function OrderStatusDashboardHeader({
  canExportCurrentFilters,
  exportDisabled,
  isExporting,
  isFetching,
  isLoading,
  onExport,
  onPreloadExport,
  onRefetch,
  onToggleKpis,
  showKpis,
}: OrderStatusDashboardHeaderProps) {
  const isRefreshing = isFetching && !isLoading

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-white via-blue-50/30 to-slate-50/50 px-4 py-2 shadow-sm dark:border-blue-900/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/40">
      {/* 背景装饰元素 */}
      <div className="absolute -top-8 -right-8 size-32 rounded-full bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-transparent blur-3xl dark:from-blue-900/30 dark:via-blue-900/10 dark:to-transparent" />
      <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-transparent blur-2xl dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-transparent" />
      <div className="absolute top-0 right-20 h-px w-48 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent dark:via-blue-800/40" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        {/* 左侧：标题 */}
        <div className="flex items-center gap-4">
          {/* 装饰性图标容器 */}
          <div className="relative">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30">
              <svg
                className="size-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            {/* 图标光晕 */}
            <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-md" />
          </div>

          <div>
            <Title
              level={4}
              className="mb-0! !text-base !font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text dark:from-slate-100 dark:via-slate-200 dark:to-slate-400">
                订单现状
              </span>
            </Title>
            <p className="mt-0 text-[11px] text-slate-400 dark:text-slate-500">
              实时监控生产进度与订单状态
            </p>
          </div>
        </div>

        {/* 右侧：看板开关 / 导出 / 刷新 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="small"
            icon={<DocumentChartBarIcon className="size-3.5" />}
            onClick={onToggleKpis}
            className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
          >
            {showKpis ? '收起看板' : '展开看板'}
          </Button>
          {canExportCurrentFilters && (
            <Button
              size="small"
              icon={<ArrowDownTrayIcon className="size-3.5" />}
              loading={isExporting}
              disabled={exportDisabled}
              onClick={() => void onExport()}
              onMouseEnter={onPreloadExport}
              onFocus={onPreloadExport}
              className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
            >
              导出当前筛选结果
            </Button>
          )}

          {/* 刷新按钮 */}
          <Button
            size="small"
            icon={(
              <ArrowPathIcon
                className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            )}
            loading={isRefreshing}
            onClick={() => void onRefetch()}
            className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
          >
            刷新
          </Button>
        </div>
      </div>
    </div>
  )
}
