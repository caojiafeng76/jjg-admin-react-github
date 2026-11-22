import type { WorkshopOrderStatus } from './orderStatus'

import type { WorkshopOrder } from './types'
import type { TransferWorkshopStat } from '@/services/apiMaterialTransfers'
import {
  ArchiveBoxArrowDownIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  HashtagIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { Alert, Button, Progress, Tooltip } from 'antd'
import { isWarehouseWorkshop } from '@/services/apiMaterialTransfers'
import StatusPill from '@/ui/StatusPill'
import {
  canWorkshopOrderBeClosed,
  getWorkshopOrderStatusTone,
  normalizeWorkshopOrderStatus,
} from './orderStatus'

export default function WorkshopOrderInfoHeader({
  order,
  transferStats,
  canManageStatus = false,
  onStatusChange,
  statusUpdating = false,
}: {
  order: WorkshopOrder
  transferStats?: {
    byWorkshop: TransferWorkshopStat[]
    totalOutbound: number
    totalInWarehouse: number
    totalTransferred: number
  }
  canManageStatus?: boolean
  onStatusChange?: (status: WorkshopOrderStatus) => Promise<void> | void
  statusUpdating?: boolean
}) {
  const orderQty = order.order_quantity ?? 0
  const outbound = transferStats?.totalOutbound ?? 0
  const status = normalizeWorkshopOrderStatus(order.status)
  const progressPercent
    = orderQty > 0 ? Math.min(Math.round((outbound / orderQty) * 100), 100) : 0
  const shouldRemindClose = canWorkshopOrderBeClosed({
    status,
    orderQuantity: orderQty,
    totalOutbound: outbound,
  })
  const progressStatus
    = progressPercent >= 100
      ? 'success'
      : progressPercent > 0
        ? 'active'
        : 'normal'

  return (
    <div className="rounded-t-lg border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80 px-4 py-3 dark:border-slate-700/50 dark:from-slate-800/80 dark:to-slate-800/95">
      {/* 警告提示 */}
      {shouldRemindClose && canManageStatus && onStatusChange && (
        <Alert
          showIcon
          type="warning"
          className="mb-3"
          title={(
            <span className="flex items-center gap-2">
              <ExclamationTriangleIcon className="size-4 text-warning" />
              <span>出库进度已达 100%，请尽快修改为已结案</span>
            </span>
          )}
          description="结案后，新建生产工单时将不再显示该订单，避免继续关联。"
          action={(
            <Button
              type="primary"
              danger
              size="small"
              loading={statusUpdating}
              onClick={() => void onStatusChange('已结案')}
              className="shadow-sm"
            >
              立即结案
            </Button>
          )}
        />
      )}

      {/* 基础订单信息 - 工业风格网格 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-8">
        {/* 状态 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <CheckBadgeIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500">状态</p>
            <StatusPill
              tone={getWorkshopOrderStatusTone(status)}
              className="mt-0.5"
            >
              {status}
            </StatusPill>
          </div>
        </div>

        {/* 项目号 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <TagIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">项目号</p>
            <p className="truncate font-medium text-slate-700 dark:text-slate-200">
              {order.project_no || '-'}
            </p>
          </div>
        </div>

        {/* 型号 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <CubeIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">型号</p>
            <p className="truncate font-medium text-slate-700 dark:text-slate-200">
              {order.product_model || '-'}
            </p>
          </div>
        </div>

        {/* 长度 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <ArrowsRightLeftIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500">长度</p>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {order.length_mm ? `${order.length_mm} mm` : '-'}
            </p>
          </div>
        </div>

        {/* 料号 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <HashtagIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">料号</p>
            <p className="truncate font-medium text-slate-700 dark:text-slate-200">
              {order.material_code || '-'}
            </p>
          </div>
        </div>

        {/* 订单支数 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <ClipboardDocumentListIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500">订单支数</p>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {orderQty || '-'}
            </p>
          </div>
        </div>

        {/* 出库支数 */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
            <ArchiveBoxArrowDownIcon className="size-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500">出库支数</p>
            <p
              className="font-medium"
              style={{
                color:
                  (transferStats?.totalOutbound ?? 0) >= orderQty
                  && orderQty > 0
                    ? '#389e0d'
                    : (transferStats?.totalOutbound ?? 0) > 0
                        ? '#1677ff'
                        : '#999',
              }}
            >
              {transferStats?.totalOutbound ?? 0}
            </p>
          </div>
        </div>

        {/* 入库支数 */}
        {(transferStats?.totalInWarehouse ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
              <CheckIcon className="size-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-slate-500">入库支数</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {transferStats!.totalInWarehouse}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 出库进度条 */}
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 text-xs text-slate-500">出库进度</span>
        <Progress
          percent={progressPercent}
          status={progressStatus}
          size="small"
          style={{ flex: 1, marginBottom: 0 }}
          strokeColor={{
            '0%': '#3b82f6',
            '100%': progressPercent >= 100 ? '#22c55e' : '#60a5fa',
          }}
          railColor="#e5e7eb"
          format={pct => (
            <span className="text-xs font-medium text-slate-600">
              {outbound} / {orderQty} ({pct}%)
            </span>
          )}
        />
      </div>

      {/* 各车间转移数量 */}
      {transferStats && transferStats.byWorkshop.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-slate-500">车间流转：</span>
          {transferStats.byWorkshop.map(ws => (
            <Tooltip
              key={ws.target_workshop}
              title={`${ws.record_count} 条记录`}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs transition-colors hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700">
                <StatusPill
                  dot={false}
                  tone={
                    isWarehouseWorkshop(ws.target_workshop)
                      ? 'success'
                      : ws.target_workshop === '包装'
                        ? 'info'
                        : 'neutral'
                  }
                >
                  {ws.target_workshop}
                </StatusPill>
                <span
                  style={{
                    color:
                      isWarehouseWorkshop(ws.target_workshop)
                        ? '#389e0d'
                        : ws.target_workshop === '包装'
                          ? '#1677ff'
                          : '#555',
                  }}
                >
                  {ws.total_quantity}
                </span>
              </span>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}
