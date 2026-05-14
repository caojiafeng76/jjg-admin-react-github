import { memo, useMemo } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onRowSelectionChange: (
    keys: React.Key[],
    rows: ProductionDailyReportRow[],
  ) => void
  scrollY?: number
  rowHeight?: number
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

function ProductionDailyReportTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onRowSelectionChange,
  scrollY = 400,
  rowHeight = 40,
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
        filters: [
          { text: 'A', value: 'A' },
          { text: 'B', value: 'B' },
        ],
        onFilter: (value, record) => record.dataCategory === (value as string),
      },
      {
        title: '项目号',
        dataIndex: 'projectNo',
        key: 'projectNo',
        width: 140,
        fixed: 'left',
        filters: Array.from(new Set(data.map((r) => r.projectNo))).map((v) => ({
          text: v,
          value: v,
        })),
        onFilter: (value, record) => record.projectNo === (value as string),
        filterSearch: true,
      },
      {
        title: '产品型号',
        dataIndex: 'productModel',
        key: 'productModel',
        width: 120,
        filters: Array.from(new Set(data.map((r) => r.productModel))).map(
          (v) => ({ text: v, value: v }),
        ),
        onFilter: (value, record) => record.productModel === (value as string),
        filterSearch: true,
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
        filters: Array.from(
          new Set(
            data.map((r) => r.lengthMm).filter((v): v is number => v !== null),
          ),
        )
          .sort((a, b) => a - b)
          .map((v) => ({ text: `${v}mm`, value: v })),
        onFilter: (value, record) => record.lengthMm === (value as number),
        render: (value: number | null) => renderNumber(value),
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 120,
        filters: Array.from(new Set(data.map((r) => r.operation))).map((v) => ({
          text: v,
          value: v,
        })),
        onFilter: (value, record) => record.operation === (value as string),
        filterSearch: true,
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
        title: '外协不良数',
        dataIndex: 'outsourceDefectCount',
        key: 'outsourceDefectCount',
        width: 110,
      },
      {
        title: '外协不良原因',
        dataIndex: 'outsourceDefectReason',
        key: 'outsourceDefectReason',
        width: 150,
      },
      {
        title: '外协单位',
        dataIndex: 'outsourceUnit',
        key: 'outsourceUnit',
        width: 130,
      },
      {
        title: '调机不良',
        dataIndex: 'setupDefectCount',
        key: 'setupDefectCount',
        width: 110,
      },
      {
        title: '调机负责人',
        dataIndex: 'setupResponsible',
        key: 'setupResponsible',
        width: 130,
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
        title: '外协不良重量kg',
        dataIndex: 'outsourceDefectWeightKg',
        key: 'outsourceDefectWeightKg',
        width: 140,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '调机不良重量kg',
        dataIndex: 'setupDefectWeightKg',
        key: 'setupDefectWeightKg',
        width: 140,
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
    [page, pageSize, data],
  )

  const rowSelection: TableProps<ProductionDailyReportRow>['rowSelection'] =
    useMemo(
      () => ({
        selectedRowKeys,
        onChange: (keys, rows) => onRowSelectionChange(keys, rows),
        fixed: true,
        columnWidth: 40,
        preserveSelectedRowKeys: true,
      }),
      [onRowSelectionChange, selectedRowKeys],
    )

  return (
    <Table<ProductionDailyReportRow>
      rowKey={(record) => record.key}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      virtual
      size="small"
      scroll={{ x: 2750, y: scrollY }}
      onRow={() => ({ style: { height: rowHeight } })}
      style={{ fontSize: '12px' }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={9}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={10}>
              <span className="font-semibold text-slate-900">
                {currentPageQualifiedCount}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={11} colSpan={15} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}

export default memo(ProductionDailyReportTable)
