import type { WorkshopOrderStatus } from './orderStatus'

import type { WorkshopOrder } from './types'
import type { TransferWorkshopStat } from '@/services/apiMaterialTransfers'
import { Alert, Button, Progress, Tag, Tooltip } from 'antd'
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
          message={(
            <span className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="size-3 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm dark:from-slate-700 dark:to-slate-800">
            <svg
              className="size-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm dark:from-blue-900/30 dark:to-blue-800/30">
            <svg
              className="size-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm dark:from-purple-900/30 dark:to-purple-800/30">
            <svg
              className="size-4 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm dark:from-emerald-900/30 dark:to-emerald-800/30">
            <svg
              className="size-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm dark:from-amber-900/30 dark:to-amber-800/30">
            <svg
              className="size-4 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-sm dark:from-cyan-900/30 dark:to-cyan-800/30">
            <svg
              className="size-4 text-cyan-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm dark:from-orange-900/30 dark:to-orange-800/30">
            <svg
              className="size-4 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
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
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100 shadow-sm dark:from-green-900/30 dark:to-green-800/30">
              <svg
                className="size-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
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
          trailColor="#e5e7eb"
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
                <Tag
                  color={
                    ws.target_workshop === '仓库'
                      ? 'success'
                      : ws.target_workshop === '包装'
                        ? 'processing'
                        : 'default'
                  }
                  style={{
                    fontSize: 10,
                    padding: '0 4px',
                    marginRight: 2,
                    marginInlineEnd: 0,
                  }}
                >
                  {ws.target_workshop}
                </Tag>
                <span
                  style={{
                    color:
                      ws.target_workshop === '仓库'
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
