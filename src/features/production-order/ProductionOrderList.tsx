import { useMemo } from 'react'
import { Table, TableColumnsType, TableProps, Button } from 'antd'
import { EyeIcon } from '@heroicons/react/16/solid'

import type { ProductionOrderListItem } from '@/services/apiProductionOrders'

const warningTextStyle = {
  color: '#d4b106',
  fontWeight: 600,
}

const dangerTextStyle = {
  color: '#cf1322',
  fontWeight: 600,
}

interface Props {
  loading: boolean
  data: ProductionOrderListItem[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onView: (record: ProductionOrderListItem) => void
  scrollY?: number
}

export default function ProductionOrderList({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onView,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ProductionOrderListItem> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        width: 50,
      },
      {
        title: '日期',
        dataIndex: 'order_date',
        fixed: 'left',
        key: 'order_date',
        width: 120,
      },
      {
        title: '操作人',
        key: 'employee',
        fixed: 'left',
        width: 120,
        render: (_text, record: ProductionOrderListItem) =>
          record.employee?.name || '-',
      },
      {
        title: '出勤工时(h)',
        dataIndex: 'work_hours',
        key: 'work_hours',
        width: 110,
      },
      {
        title: '合格工时(h)',
        dataIndex: 'total_qualified_hours',
        key: 'total_qualified_hours',
        width: 120,
        render: (value: number | null, record: ProductionOrderListItem) => {
          if (value === null || value === undefined) {
            return '-'
          }

          return (
            <span
              style={
                record.hasZeroStandardQualifiedItem
                  ? dangerTextStyle
                  : undefined
              }
            >
              {value.toFixed(2)}
            </span>
          )
        },
      },
      {
        title: '工时效率(%)',
        dataIndex: 'efficiency',
        key: 'efficiency',
        width: 110,
        render: (value: number | null) => {
          if (value === null || value === undefined) {
            return '-'
          }

          const efficiencyPercent = value * 100
          const isWarning = efficiencyPercent < 90 || efficiencyPercent > 120

          return (
            <span style={isWarning ? warningTextStyle : undefined}>
              {efficiencyPercent.toFixed(2)}
            </span>
          )
        },
      },

      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        ellipsis: true,
        width: 150,
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 72,
        render: (_text, record: ProductionOrderListItem) => (
          <Button
            type="text"
            size="small"
            icon={<EyeIcon className="h-4 w-4" />}
            onClick={() => onView(record)}
            title="查看"
          />
        ),
      },
    ],
    [onView],
  )

  const rowSelection: TableProps<ProductionOrderListItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    preserveSelectedRowKeys: true,
  }

  return (
    <Table<ProductionOrderListItem>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
