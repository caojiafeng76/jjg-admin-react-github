import type { WorkshopOrder } from './index'
import type { WorkshopOrderStatus } from './orderStatus'

import type { OperationSummary } from './workshopOrderProductionStatsColumns'
import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'
import { ClipboardDocumentListIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { Empty, Spin, Tabs } from 'antd'
import { useMemo } from 'react'
import StatusPill from '@/ui/StatusPill'
import { useWorkshopOrderProductionItems } from './useWorkshopOrderProductionItems'
import { useWorkshopOrderTransfers } from './useWorkshopOrderTransfers'
import WorkshopOrderInfoHeader from './WorkshopOrderInfoHeader'
import WorkshopOrderOperationRecordsTable from './WorkshopOrderOperationRecordsTable'

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
  const { data: transferStats, isLoading: isTransferLoading }
    = useWorkshopOrderTransfers(projectNo)

  const operationGroups = useMemo<OperationSummary[]>(() => {
    if (!items || items.length === 0)
      return []

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
          sum
          + (i.defect_quantity_1 ?? 0)
          + (i.defect_quantity_2 ?? 0)
          + (i.outsource_defect_quantity ?? 0)
          + (i.setup_defect_quantity ?? 0),
        0,
      ),
    }))
  }, [items])

  if (!selectedOrder) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
          <ClipboardDocumentListIcon className="size-10 text-slate-400" />
        </div>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <div className="text-center">
              <p className="font-medium text-slate-600 dark:text-slate-300">
                点击上方订单行查看详情
              </p>
              <p className="mt-1 text-sm text-slate-400">
                选择订单后可在下方查看生产工单统计
              </p>
            </div>
          )}
        />
      </div>
    )
  }

  if (isLoading || isTransferLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Spin size="large" className="mb-4" />
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
          <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
            <LightBulbIcon className="size-10 text-slate-400" />
          </div>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={(
              <div className="text-center">
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  暂无生产工单记录
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  该订单暂无关联的生产工单数据
                </p>
              </div>
            )}
          />
        </div>
      </div>
    )
  }

  const tabItems = operationGroups.map(group => ({
    key: group.operation,
    label: (
      <span className="flex items-center gap-2">
        <StatusPill tone="info" dot={false}>
          {group.operation}
        </StatusPill>
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
        />
      </div>
    </div>
  )
}
