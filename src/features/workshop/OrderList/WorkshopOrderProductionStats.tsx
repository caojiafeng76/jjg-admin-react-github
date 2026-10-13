import { useMemo } from 'react'
import { Tabs, Tag, Spin, Empty } from 'antd'

import type { WorkshopOrder } from './index'
import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'
import { useWorkshopOrderProductionItems } from './useWorkshopOrderProductionItems'
import { useWorkshopOrderTransfers } from './useWorkshopOrderTransfers'
import type { WorkshopOrderStatus } from './orderStatus'
import WorkshopOrderInfoHeader from './WorkshopOrderInfoHeader'
import WorkshopOrderOperationRecordsTable from './WorkshopOrderOperationRecordsTable'
import {
  getOperationColor,
  type OperationSummary,
} from './workshopOrderProductionStatsColumns'

interface Props {
  selectedOrder: WorkshopOrder | null
  canManageStatus?: boolean
  onStatusChange?: (status: WorkshopOrderStatus) => Promise<void> | void
  statusUpdating?: boolean
}

export default function WorkshopOrderProductionStats({
  selectedOrder,
  canManageStatus = false,
  onStatusChange,
  statusUpdating = false,
}: Props) {
  const projectNo = selectedOrder?.project_no ?? null

  const { data: items, isLoading } = useWorkshopOrderProductionItems(projectNo)
  const { data: transferStats, isLoading: isTransferLoading } =
    useWorkshopOrderTransfers(projectNo)

  const operationGroups = useMemo<OperationSummary[]>(() => {
    if (!items || items.length === 0) return []

    const groupMap = new Map<string, ProductionItemWithOrderDetail[]>()
    for (const item of items) {
      const group = groupMap.get(item.operation) ?? []
      group.push(item)
      groupMap.set(item.operation, group)
    }

    return Array.from(groupMap.entries()).map(([operation, groupItems]) => ({
      operation,
      items: groupItems,
      totalIncoming: groupItems.reduce(
        (sum, i) => sum + (i.incoming_qualified_quantity ?? 0),
        0,
      ),
      totalQualified: groupItems.reduce(
        (sum, i) => sum + (i.qualified_quantity ?? 0),
        0,
      ),
      totalDefect: groupItems.reduce(
        (sum, i) =>
          sum +
          (i.defect_quantity_1 ?? 0) +
          (i.defect_quantity_2 ?? 0) +
          (i.outsource_defect_quantity ?? 0) +
          (i.setup_defect_quantity ?? 0),
        0,
      ),
    }))
  }, [items])

  if (!selectedOrder) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-4 shadow-inner dark:from-slate-700 dark:to-slate-800">
          <svg
            className="size-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center">
              <p className="font-medium text-slate-600 dark:text-slate-300">
                点击上方订单行查看详情
              </p>
              <p className="mt-1 text-sm text-slate-400">
                选择订单后可在下方查看生产工单统计
              </p>
            </div>
          }
        />
      </div>
    )
  }

  if (isLoading || isTransferLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
          <Spin
            size="large"
            className="relative"
            indicator={
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <svg
                  className="size-6 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            }
          />
        </div>
        <p className="text-sm font-medium text-slate-500">
          正在加载生产数据...
        </p>
      </div>
    )
  }

  if (operationGroups.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <WorkshopOrderInfoHeader
          order={selectedOrder}
          transferStats={transferStats}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
          statusUpdating={statusUpdating}
        />
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="mb-4 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 p-4 shadow-inner dark:from-amber-900/30 dark:to-amber-800/30">
            <svg
              className="size-10 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  暂无生产工单记录
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  该订单暂无关联的生产工单数据
                </p>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  const tabItems = operationGroups.map((group) => ({
    key: group.operation,
    label: (
      <span className="flex items-center gap-2">
        <Tag
          color={getOperationColor(group.operation)}
          className="border-0"
          style={{
            marginRight: 4,
            fontSize: 11,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {group.operation}
        </Tag>
        <span className="text-xs text-slate-500">
          合格{' '}
          <span className="font-medium text-green-600">
            {group.totalQualified}
          </span>
          {group.totalDefect > 0 && (
            <>
              {' · 不良 '}
              <span className="font-medium text-red-500">
                {group.totalDefect}
              </span>
            </>
          )}
        </span>
      </span>
    ),
    children: <WorkshopOrderOperationRecordsTable group={group} />,
  }))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WorkshopOrderInfoHeader
        order={selectedOrder}
        transferStats={transferStats}
        canManageStatus={canManageStatus}
        onStatusChange={onStatusChange}
        statusUpdating={statusUpdating}
      />
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Tabs
          size="small"
          items={tabItems}
          style={{ fontSize: 11 }}
          tabBarStyle={{
            marginBottom: 8,
            borderBottom: '1px solid #e5e7eb',
          }}
          className="[&_.ant-tabs-tab]:px-3 [&_.ant-tabs-tab]:py-1.5 [&_.ant-tabs-tab:hover]:text-blue-600"
        />
      </div>
    </div>
  )
}
