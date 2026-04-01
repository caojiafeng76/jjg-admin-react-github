import { useMemo } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
  page: number
  pageSize: number
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
  page,
  pageSize,
  selectedRowKeys,
  onRowSelectionChange,
  scrollY = 400,
}: Props) {
  const currentPageQualifiedCount = useMemo(
    () =>
      data.reduce(
        (total, record) => total + Number(record.qualifiedCount || 0),
        0,
      ),
    [data],
  )

  const columns: TableColumnsType<ProductionDailyReportRow> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '日期',
        dataIndex: 'orderDate',
        key: 'orderDate',
        width: 120,
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
        title: '数据类别',
        dataIndex: 'dataCategory',
        key: 'dataCategory',
        width: 100,
        fixed: 'left',
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
        title: '客户型号',
        dataIndex: 'customerModel',
        key: 'customerModel',
        width: 120,
      },
      {
        title: '长度',
        dataIndex: 'lengthMm',
        key: 'lengthMm',
        width: 90,
        render: (value: number | null) => renderNumber(value),
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 120,
      },
      {
        title: '来料合格数',
        dataIndex: 'incomingQualifiedCount',
        key: 'incomingQualifiedCount',
        width: 100,
      },
      {
        title: '成品合格数',
        dataIndex: 'qualifiedCount',
        key: 'qualifiedCount',
        width: 90,
      },
      {
        title: '不良数量',
        dataIndex: 'defectCount',
        key: 'defectCount',
        width: 100,
      },
      {
        title: '原料不良',
        dataIndex: 'rawMaterialDefectCount',
        key: 'rawMaterialDefectCount',
        width: 110,
      },
      {
        title: '加工不良',
        dataIndex: 'processingDefectCount',
        key: 'processingDefectCount',
        width: 110,
      },
      {
        title: '合格率',
        dataIndex: 'qualifiedRate',
        key: 'qualifiedRate',
        width: 100,
        render: (value: number) => `${(value * 100).toFixed(2)}%`,
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
        width: 140,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 180,
      },
    ],
    [page, pageSize],
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
      scroll={{ x: 2050, y: scrollY }}
      style={{ fontSize: '12px' }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={10}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={11}>
              <span className="font-semibold text-slate-900">
                {currentPageQualifiedCount}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={12} colSpan={8} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
