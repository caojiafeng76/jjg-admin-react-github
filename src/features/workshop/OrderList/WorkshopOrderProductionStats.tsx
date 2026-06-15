import {
  useMemo,
} from 'react'
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
  canWorkshopOrderBeClosed,
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
    title: '外协不良数',
    dataIndex: 'outsource_defect_quantity',
    key: 'outsource_defect_quantity',
    width: 88,
    align: 'right',
    render: (v: number) =>
      v > 0 ? <Text style={{ color: '#cf1322' }}>{v}</Text> : '-',
  },
  {
    title: '外协不良原因',
    dataIndex: 'outsource_defect_reason',
    key: 'outsource_defect_reason',
    width: 120,
    render: (v: string | null) => v || '-',
  },
  {
    title: '外协单位',
    dataIndex: 'outsource_unit',
    key: 'outsource_unit',
    width: 100,
    render: (v: string | null) => v || '-',
  },
  {
    title: '调机不良',
    dataIndex: 'setup_defect_quantity',
    key: 'setup_defect_quantity',
    width: 80,
    align: 'right',
    render: (v: number) =>
      v > 0 ? <Text style={{ color: '#cf1322' }}>{v}</Text> : '-',
  },
  {
    title: '调机负责人',
    dataIndex: 'setup_responsible',
    key: 'setup_responsible',
    width: 100,
    render: (v: string | null) => v || '-',
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
                  className="size-6 text-white animate-spin"
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
        <p className="text-sm font-medium text-slate-500">正在加载生产数据...</p>
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
          <span className="font-medium text-green-600">{group.totalQualified}</span>
          {group.totalDefect > 0 && (
            <>
              {' · 不良 '}
              <span className="font-medium text-red-500">{group.totalDefect}</span>
            </>
          )}
        </span>
      </span>
    ),
    children: (
      <div className="rounded-lg border border-slate-200/50 bg-white/50 p-2 dark:border-slate-700/50 dark:bg-slate-800/30">
        <Table<ProductionItemWithOrderDetail>
          rowKey="id"
          columns={recordColumns}
          dataSource={group.items}
          size="small"
          pagination={false}
          scroll={{ x: 'max-content', y: 180 }}
          style={{ fontSize: 11 }}
          className="shadow-sm"
          summary={() => {
            const totalDefect1 = group.items.reduce(
              (sum, item) => sum + (item.defect_quantity_1 ?? 0),
              0,
            )
            const totalDefect2 = group.items.reduce(
              (sum, item) => sum + (item.defect_quantity_2 ?? 0),
              0,
            )
            const totalOutsourceDefect = group.items.reduce(
              (sum, item) => sum + (item.outsource_defect_quantity ?? 0),
              0,
            )
            const totalSetupDefect = group.items.reduce(
              (sum, item) => sum + (item.setup_defect_quantity ?? 0),
              0,
            )

            return (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      合计（{group.items.length} 条）
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {group.totalIncoming}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <span className="text-xs font-semibold text-green-600">
                      {group.totalQualified}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                  <Table.Summary.Cell index={6} align="right">
                    {totalDefect1 > 0 ? (
                      <span className="text-xs font-semibold text-red-500">
                        {totalDefect1}
                      </span>
                    ) : (
                      '-'
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} />
                  <Table.Summary.Cell index={8} align="right">
                    {totalDefect2 > 0 ? (
                      <span className="text-xs font-semibold text-red-500">
                        {totalDefect2}
                      </span>
                    ) : (
                      '-'
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="right">
                    {totalOutsourceDefect > 0 ? (
                      <span className="text-xs font-semibold text-red-500">
                        {totalOutsourceDefect}
                      </span>
                    ) : (
                      '-'
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} />
                  <Table.Summary.Cell index={11} />
                  <Table.Summary.Cell index={12} align="right">
                    {totalSetupDefect > 0 ? (
                      <span className="text-xs font-semibold text-red-500">
                        {totalSetupDefect}
                      </span>
                    ) : (
                      '-'
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13} />
                  <Table.Summary.Cell index={14} />
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </div>
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
  const shouldRemindClose = canWorkshopOrderBeClosed({
    status,
    orderQuantity: orderQty,
    totalOutbound: outbound,
  })
  const progressStatus =
    progressPercent >= 100
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
          message={
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
          }
          description="结案后，新建生产工单时将不再显示该订单，避免继续关联。"
          action={
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
          }
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
            <Tag color={getWorkshopOrderStatusColor(status)} className="mt-0.5">
              {status}
            </Tag>
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
                  (transferStats?.totalOutbound ?? 0) >= orderQty && orderQty > 0
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
            '100%':
              progressPercent >= 100 ? '#22c55e' : '#60a5fa',
          }}
          trailColor="#e5e7eb"
          format={(pct) => (
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
          {transferStats.byWorkshop.map((ws) => (
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
