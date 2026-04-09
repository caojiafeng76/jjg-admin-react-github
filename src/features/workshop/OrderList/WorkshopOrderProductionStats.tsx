import { useMemo } from 'react'
import {
  Alert,
  Button,
  Table,
  TableColumnsType,
  Tabs,
  Tag,
  Typography,
  Spin,
  Empty,
  Progress,
  Tooltip,
} from 'antd'

import type { WorkshopOrder } from './index'
import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'
import type { TransferWorkshopStat } from '@/services/apiMaterialTransfers'
import { useWorkshopOrderProductionItems } from './useWorkshopOrderProductionItems'
import { useWorkshopOrderTransfers } from './useWorkshopOrderTransfers'
import type { WorkshopOrderStatus } from './orderStatus'
import {
  getWorkshopOrderStatusColor,
  normalizeWorkshopOrderStatus,
} from './orderStatus'

interface Props {
  selectedOrder: WorkshopOrder | null
  canManageStatus?: boolean
  onStatusChange?: (status: WorkshopOrderStatus) => Promise<void> | void
  statusUpdating?: boolean
}

const { Text } = Typography

const operationColors: Record<string, string> = {
  挤压: 'blue',
  抛光: 'cyan',
  氧化: 'purple',
  喷涂: 'orange',
  精切: 'green',
  深加工: 'volcano',
  检验: 'gold',
  包装: 'lime',
}

function getOperationColor(operation: string) {
  for (const key of Object.keys(operationColors)) {
    if (operation.includes(key)) return operationColors[key]
  }
  return 'default'
}

const recordColumns: TableColumnsType<ProductionItemWithOrderDetail> = [
  {
    title: '日期',
    dataIndex: 'order_date',
    key: 'order_date',
    width: 100,
    fixed: 'left',
  },
  {
    title: '班别',
    dataIndex: 'shift',
    key: 'shift',
    width: 60,
    render: (v: string) => (
      <Tag color={v === '白班' ? 'blue' : 'purple'} style={{ fontSize: 11 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: '员工',
    dataIndex: 'employee_name',
    key: 'employee_name',
    width: 80,
    render: (v: string | null) => v || '-',
  },
  {
    title: '来料合格',
    dataIndex: 'incoming_qualified_quantity',
    key: 'incoming_qualified_quantity',
    width: 80,
    align: 'right',
  },
  {
    title: '合格数',
    dataIndex: 'qualified_quantity',
    key: 'qualified_quantity',
    width: 70,
    align: 'right',
    render: (v: number) => <Text style={{ color: '#389e0d' }}>{v}</Text>,
  },
  {
    title: '不良原因1',
    dataIndex: 'defect_reason_1',
    key: 'defect_reason_1',
    width: 100,
    render: (v: string | null) => v || '-',
  },
  {
    title: '不良数1',
    dataIndex: 'defect_quantity_1',
    key: 'defect_quantity_1',
    width: 70,
    align: 'right',
    render: (v: number) =>
      v > 0 ? <Text style={{ color: '#cf1322' }}>{v}</Text> : '-',
  },
  {
    title: '不良原因2',
    dataIndex: 'defect_reason_2',
    key: 'defect_reason_2',
    width: 100,
    render: (v: string | null) => v || '-',
  },
  {
    title: '不良数2',
    dataIndex: 'defect_quantity_2',
    key: 'defect_quantity_2',
    width: 70,
    align: 'right',
    render: (v: number) =>
      v > 0 ? <Text style={{ color: '#cf1322' }}>{v}</Text> : '-',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    render: (v: string | null) => v || '-',
  },
]

interface OperationSummary {
  operation: string
  items: ProductionItemWithOrderDetail[]
  totalIncoming: number
  totalQualified: number
  totalDefect: number
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
          sum + (i.defect_quantity_1 ?? 0) + (i.defect_quantity_2 ?? 0),
        0,
      ),
    }))
  }, [items])

  if (!selectedOrder) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="点击上方订单行查看生产工单"
        />
      </div>
    )
  }

  if (isLoading || isTransferLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin tip="加载中..." />
      </div>
    )
  }

  if (operationGroups.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <OrderInfoHeader
          order={selectedOrder}
          transferStats={transferStats}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
          statusUpdating={statusUpdating}
        />
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无生产工单记录"
          />
        </div>
      </div>
    )
  }

  const tabItems = operationGroups.map((group) => ({
    key: group.operation,
    label: (
      <span>
        <Tag
          color={getOperationColor(group.operation)}
          style={{ marginRight: 4, fontSize: 11 }}
        >
          {group.operation}
        </Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>
          合格{' '}
          <Text style={{ color: '#389e0d', fontSize: 11 }}>
            {group.totalQualified}
          </Text>
          {group.totalDefect > 0 && (
            <>
              {' '}
              · 不良{' '}
              <Text style={{ color: '#cf1322', fontSize: 11 }}>
                {group.totalDefect}
              </Text>
            </>
          )}
        </Text>
      </span>
    ),
    children: (
      <Table<ProductionItemWithOrderDetail>
        rowKey="id"
        columns={recordColumns}
        dataSource={group.items}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content', y: 180 }}
        style={{ fontSize: 11 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong style={{ fontSize: 11 }}>
                  合计（{group.items.length} 条）
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <Text style={{ fontSize: 11 }}>{group.totalIncoming}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <Text strong style={{ color: '#389e0d', fontSize: 11 }}>
                  {group.totalQualified}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} />
              <Table.Summary.Cell index={6} align="right">
                {group.totalDefect > 0 ? (
                  <Text strong style={{ color: '#cf1322', fontSize: 11 }}>
                    {group.items.reduce(
                      (s, i) => s + (i.defect_quantity_1 ?? 0),
                      0,
                    )}
                  </Text>
                ) : (
                  '-'
                )}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} />
              <Table.Summary.Cell index={8} align="right">
                {group.items.reduce(
                  (s, i) => s + (i.defect_quantity_2 ?? 0),
                  0,
                ) > 0 ? (
                  <Text strong style={{ color: '#cf1322', fontSize: 11 }}>
                    {group.items.reduce(
                      (s, i) => s + (i.defect_quantity_2 ?? 0),
                      0,
                    )}
                  </Text>
                ) : (
                  '-'
                )}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    ),
  }))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <OrderInfoHeader
        order={selectedOrder}
        transferStats={transferStats}
        canManageStatus={canManageStatus}
        onStatusChange={onStatusChange}
        statusUpdating={statusUpdating}
      />
      <div className="min-h-0 flex-1 overflow-auto px-2">
        <Tabs
          size="small"
          items={tabItems}
          style={{ fontSize: 11 }}
          tabBarStyle={{ marginBottom: 4 }}
        />
      </div>
    </div>
  )
}

function OrderInfoHeader({
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
  const progressPercent =
    orderQty > 0 ? Math.min(Math.round((outbound / orderQty) * 100), 100) : 0
  const shouldRemindClose =
    status === '生产中' && orderQty > 0 && outbound >= orderQty
  const progressStatus =
    progressPercent >= 100
      ? 'success'
      : progressPercent > 0
        ? 'active'
        : 'normal'

  return (
    <div className="border-b px-3 py-2">
      {shouldRemindClose && canManageStatus && onStatusChange && (
        <Alert
          showIcon
          type="warning"
          className="mb-2"
          message="该订单出库进度已达 100%，请尽快修改为已结案"
          description="结案后，新建生产工单时将不再显示该订单，避免继续关联。"
          action={
            <Button
              type="primary"
              danger
              size="small"
              loading={statusUpdating}
              onClick={() => void onStatusChange('已结案')}
            >
              立即结案
            </Button>
          }
        />
      )}

      {/* 基础订单信息 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-600">
        <span>
          状态：
          <Tag color={getWorkshopOrderStatusColor(status)}>{status}</Tag>
        </span>
        <span>
          项目号：
          <Text strong style={{ fontSize: 12 }}>
            {order.project_no || '-'}
          </Text>
        </span>
        <span>
          型号：
          <Text strong style={{ fontSize: 12 }}>
            {order.product_model || '-'}
          </Text>
        </span>
        <span>
          长度：
          <Text strong style={{ fontSize: 12 }}>
            {order.length_mm ? `${order.length_mm} mm` : '-'}
          </Text>
        </span>
        <span>
          料号：
          <Text strong style={{ fontSize: 12 }}>
            {order.material_code || '-'}
          </Text>
        </span>
        <span>
          订单支数：
          <Text strong style={{ fontSize: 12 }}>
            {orderQty || '-'}
          </Text>
        </span>
        <span>
          出库支数：
          <Text
            strong
            style={{
              fontSize: 12,
              color:
                (transferStats?.totalOutbound ?? 0) >= orderQty && orderQty > 0
                  ? '#389e0d'
                  : (transferStats?.totalOutbound ?? 0) > 0
                    ? '#1677ff'
                    : '#999',
            }}
          >
            {transferStats?.totalOutbound ?? 0}
          </Text>
        </span>
        {(transferStats?.totalInWarehouse ?? 0) > 0 && (
          <span>
            入库支数：
            <Text strong style={{ fontSize: 12, color: '#389e0d' }}>
              {transferStats!.totalInWarehouse}
            </Text>
          </span>
        )}
      </div>

      {/* 出库进度 */}
      <div className="mt-1.5 flex items-center gap-3">
        <span className="shrink-0 text-xs text-gray-500">
          出库进度：
          <Text style={{ fontSize: 11, color: '#999' }}>
            {outbound} / {orderQty}
          </Text>
        </span>
        <Progress
          percent={progressPercent}
          status={progressStatus}
          size="small"
          style={{ flex: 1, marginBottom: 0 }}
          format={(pct) => <span style={{ fontSize: 11 }}>{pct}%</span>}
        />
      </div>

      {/* 各车间转移数量 */}
      {transferStats && transferStats.byWorkshop.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          {transferStats.byWorkshop.map((ws) => (
            <Tooltip
              key={ws.target_workshop}
              title={`${ws.record_count} 条记录`}
            >
              <span className="text-xs">
                <Tag
                  color={
                    ws.target_workshop === '仓库'
                      ? 'success'
                      : ws.target_workshop === '包装'
                        ? 'processing'
                        : 'default'
                  }
                  style={{ fontSize: 10, padding: '0 4px', marginRight: 2 }}
                >
                  {ws.target_workshop}
                </Tag>
                <Text
                  style={{
                    fontSize: 11,
                    color:
                      ws.target_workshop === '仓库'
                        ? '#389e0d'
                        : ws.target_workshop === '包装'
                          ? '#1677ff'
                          : '#555',
                  }}
                >
                  {ws.total_quantity}
                </Text>
              </span>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}
