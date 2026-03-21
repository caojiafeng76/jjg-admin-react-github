import { useMemo } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
  operations: string[]
  selectedRowKeys: React.Key[]
  onRowSelectionChange: NonNullable<
    TableProps<ProductionDailyReportRow>['rowSelection']
  >
  scrollY?: number
}

function renderNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined) {
    return '-'
  }

  if (digits === 0) {
    return value
  }

  return value.toFixed(digits)
}

export default function ProductionDailyReportTable({
  loading,
  data,
  operations,
  selectedRowKeys,
  onRowSelectionChange,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ProductionDailyReportRow> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        fixed: 'left',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '日期',
        dataIndex: 'orderDate',
        key: 'orderDate',
        width: 110,
        fixed: 'left',
      },
      {
        title: '工时',
        dataIndex: 'workHours',
        key: 'workHours',
        width: 90,
        fixed: 'left',
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '项目号',
        dataIndex: 'projectNo',
        key: 'projectNo',
        width: 140,
        fixed: 'left',
      },
      {
        title: '产品型号',
        dataIndex: 'productModel',
        key: 'productModel',
        width: 120,
      },
      {
        title: '长度',
        dataIndex: 'lengthMm',
        key: 'lengthMm',
        width: 90,
        render: (value: number | null) => renderNumber(value),
      },
      ...operations.map((operation) => ({
        title: operation,
        key: `operation-${operation}`,
        width: 100,
        render: (_value: unknown, record: ProductionDailyReportRow) =>
          renderNumber(record.operationQuantities[operation] || 0),
      })),
      {
        title: '原料不良数',
        dataIndex: 'rawMaterialDefectCount',
        key: 'rawMaterialDefectCount',
        width: 110,
      },
      {
        title: '加工不良数',
        dataIndex: 'processingDefectCount',
        key: 'processingDefectCount',
        width: 110,
      },
      {
        title: '原料不良重量kg',
        dataIndex: 'rawMaterialDefectWeightKg',
        key: 'rawMaterialDefectWeightKg',
        width: 130,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '加工不良重量kg',
        dataIndex: 'processingDefectWeightKg',
        key: 'processingDefectWeightKg',
        width: 130,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '操作人',
        dataIndex: 'employeeName',
        key: 'employeeName',
        width: 120,
        fixed: 'right',
      },
    ],
    [operations],
  )

  return (
    <Table<ProductionDailyReportRow>
      rowKey={(record) => record.key}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{
        ...onRowSelectionChange,
        selectedRowKeys,
        preserveSelectedRowKeys: true,
      }}
      pagination={false}
      size="small"
      scroll={{ x: 1500 + operations.length * 100, y: scrollY }}
      style={{ fontSize: '12px' }}
    />
  )
}
