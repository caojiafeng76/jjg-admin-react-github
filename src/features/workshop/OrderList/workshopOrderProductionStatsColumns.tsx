import { Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'

import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'

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

export function getOperationColor(operation: string) {
  for (const key of Object.keys(operationColors)) {
    if (operation.includes(key)) return operationColors[key]
  }
  return 'default'
}

export const recordColumns: TableColumnsType<ProductionItemWithOrderDetail> = [
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

export interface OperationSummary {
  operation: string
  items: ProductionItemWithOrderDetail[]
  totalIncoming: number
  totalQualified: number
  totalDefect: number
}
