import { useMemo, useCallback } from 'react'
import { Table, TableColumnsType, TableProps, Button, Tag, Tooltip } from 'antd'
import { EyeIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import type { ProductionOrderListItem } from '@/services/apiProductionOrders'

interface Props {
  loading: boolean
  data: ProductionOrderListItem[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onView: (record: ProductionOrderListItem) => void
  onRowClick?: (record: ProductionOrderListItem) => void
  activeRowId?: string | null
  scrollY?: number
}

export default function ProductionOrderList({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onSelect,
  onView,
  onRowClick,
  activeRowId,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ProductionOrderListItem> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        fixed: 'left',
        key: '#',
        width: 50,
        align: 'center',
      },
      {
        title: '日期',
        dataIndex: 'order_date',
        fixed: 'left',
        key: 'order_date',
        width: 110,
        render: (value: string) => (
          <span className="font-medium text-slate-700">{value}</span>
        ),
      },
      {
        title: '操作人',
        key: 'employee',
        fixed: 'left',
        width: 100,
        render: (_text, record: ProductionOrderListItem) =>
          record.employee?.name || (
            <span className="text-slate-300">-</span>
          ),
      },
      {
        title: '审核',
        dataIndex: 'is_audited',
        key: 'is_audited',
        width: 90,
        render: (value: boolean) => (
          <Tag
            color={value ? 'success' : 'default'}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {value ? '已审核' : '待审核'}
          </Tag>
        ),
      },
      {
        title: '班别',
        dataIndex: 'shift',
        key: 'shift',
        width: 80,
        render: (value: string) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              value === '白班'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        title: '出勤',
        dataIndex: 'work_hours',
        key: 'work_hours',
        width: 90,
        render: (value: number | null) => (
          <span className="font-mono text-slate-600">{(value ?? 0).toFixed(1)}h</span>
        ),
      },
      {
        title: '正工',
        dataIndex: 'positive_qualified_hours',
        key: 'positive_qualified_hours',
        width: 90,
        render: (value: number | null) => (
          <span className="font-mono text-emerald-600">
            {(value ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        title: '零工',
        dataIndex: 'extra_qualified_hours',
        key: 'extra_qualified_hours',
        width: 90,
        render: (value: number | null) => (
          <span className="font-mono text-blue-600">
            {(value ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        title: '总工时',
        dataIndex: 'total_qualified_hours',
        key: 'total_qualified_hours',
        width: 100,
        render: (value: number | null, record: ProductionOrderListItem) => {
          if (value === null || value === undefined) {
            return <span className="text-slate-300">-</span>
          }

          return (
            <Tooltip
              title={
                record.hasZeroStandardQualifiedItem
                  ? '存在标准工时为0的工序'
                  : undefined
              }
            >
              <span
                className={`font-mono font-semibold ${
                  record.hasZeroStandardQualifiedItem
                    ? 'text-red-500'
                    : 'text-slate-700'
                }`}
              >
                {value.toFixed(2)}
              </span>
            </Tooltip>
          )
        },
      },
      {
        title: '效率',
        dataIndex: 'efficiency',
        key: 'efficiency',
        width: 100,
        render: (value: number | null) => {
          if (value === null || value === undefined) {
            return <span className="text-slate-300">-</span>
          }

          const efficiencyPercent = value * 100
          const isWarning = efficiencyPercent < 90 || efficiencyPercent > 120
          const isGood = efficiencyPercent >= 100 && efficiencyPercent <= 110

          return (
            <span
              className={`inline-flex items-center gap-1 font-mono font-medium ${
                isGood
                  ? 'text-emerald-600'
                  : isWarning
                    ? 'text-amber-600'
                    : 'text-slate-600'
              }`}
            >
              {isWarning && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
              {efficiencyPercent.toFixed(1)}%
            </span>
          )
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        ellipsis: true,
        width: 140,
        render: (value: string | null) =>
          value ? (
            <Tooltip title={value}>
              <span className="text-slate-500">{value}</span>
            </Tooltip>
          ) : (
            <span className="text-slate-200">-</span>
          ),
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        render: (value: string | null) =>
          value ? (
            <span className="whitespace-nowrap text-xs text-slate-400">
              {dayjs(value).format('MM-DD HH:mm')}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          ),
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 64,
        render: (_text, record: ProductionOrderListItem) => (
          <Button
            type="text"
            size="small"
            icon={<EyeIcon className="h-4 w-4" />}
            onClick={() => onView(record)}
            title="查看"
            className="rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          />
        ),
      },
    ],
    [onView, page, pageSize],
  )

  const rowSelection: TableProps<ProductionOrderListItem>['rowSelection'] =
    useMemo(
      () => ({
        selectedRowKeys,
        onChange: onSelect,
        fixed: true,
        columnWidth: 40,
        preserveSelectedRowKeys: true,
      }),
      [onSelect, selectedRowKeys],
    )

  const handleRow = useCallback(
    (record: ProductionOrderListItem) => ({
      onClick: () => onRowClick?.(record),
      className: `transition-colors duration-150 ${
        onRowClick ? 'cursor-pointer' : ''
      } ${
        record.id && record.id === activeRowId
          ? 'bg-blue-50/70'
          : 'hover:bg-slate-50/60'
      }`,
    }),
    [activeRowId, onRowClick],
  )

  return (
    <Table<ProductionOrderListItem>
      rowKey={(record) => record.id}
      loading={{
        spinning: loading,
        tip: (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            <span className="animate-pulse">加载中...</span>
          </div>
        ),
      }}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      onRow={handleRow}
      scroll={{ y: scrollY, x: 1300 }}
      virtual
      size="small"
      pagination={false}
      className="production-order-table"
    />
  )
}
