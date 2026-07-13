import { memo, useCallback, useMemo } from 'react'
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

function renderQualifiedRate(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }
  const percent = value * 100
  const tone =
    percent >= 99
      ? 'bg-emerald-50 text-emerald-600'
      : percent >= 95
        ? 'bg-blue-50 text-blue-600'
        : 'bg-amber-50 text-amber-600'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums shadow-sm ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          percent >= 99
            ? 'bg-emerald-500'
            : percent >= 95
              ? 'bg-blue-500'
              : 'bg-amber-500'
        }`}
      />
      {percent.toFixed(2)}%
    </span>
  )
}

function renderDataCategory(value: string | null | undefined) {
  if (value !== 'A' && value !== 'B') {
    return '-'
  }
  const palette =
    value === 'A' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${palette}`}
    >
      {value}
    </span>
  )
}

function renderOperation(value: string) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {value}
    </span>
  )
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
  const currentPageDefectCount = useMemo(
    () =>
      data.reduce(
        (total, record) => total + Number(record.defectCount || 0),
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
        sorter: (a, b) => a.orderDate.localeCompare(b.orderDate),
        defaultSortOrder: 'descend',
        sortDirections: ['descend', 'ascend'],
        render: (value: string) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
      },
      {
        title: '工时',
        dataIndex: 'workHours',
        key: 'workHours',
        width: 80,
        fixed: 'left',
        render: (value: number) => (
          <span className="font-medium text-slate-700 tabular-nums">
            {renderNumber(value, 2)}
          </span>
        ),
      },
      {
        title: '数据类别',
        dataIndex: 'dataCategory',
        key: 'dataCategory',
        width: 90,
        fixed: 'left',
        filters: [
          { text: 'A', value: 'A' },
          { text: 'B', value: 'B' },
        ],
        onFilter: (value, record) => record.dataCategory === (value as string),
        render: (value: string) => renderDataCategory(value),
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
        sorter: (a, b) =>
          a.projectNo.localeCompare(b.projectNo, 'zh-CN', {
            numeric: true,
            sensitivity: 'base',
          }),
        render: (value: string) => (
          <span className="font-mono text-[13px] font-semibold tracking-tight text-slate-800">
            {value}
          </span>
        ),
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
        render: (value: number | null) => (
          <span className="text-slate-700 tabular-nums">
            {renderNumber(value)}
          </span>
        ),
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 110,
        filters: Array.from(new Set(data.map((r) => r.operation))).map((v) => ({
          text: v,
          value: v,
        })),
        onFilter: (value, record) => record.operation === (value as string),
        filterSearch: true,
        render: (value: string) => renderOperation(value),
      },
      {
        title: '来料合格数',
        dataIndex: 'incomingQualifiedCount',
        key: 'incomingQualifiedCount',
        width: 100,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
      },
      {
        title: '成品合格数',
        dataIndex: 'qualifiedCount',
        key: 'qualifiedCount',
        width: 100,
        render: (value: number) => (
          <span className="font-semibold text-emerald-700 tabular-nums">
            {value}
          </span>
        ),
      },
      {
        title: '不良数量',
        dataIndex: 'defectCount',
        key: 'defectCount',
        width: 100,
        render: (value: number) => (
          <span className="font-semibold text-rose-600 tabular-nums">
            {value}
          </span>
        ),
      },
      {
        title: '原料不良',
        dataIndex: 'rawMaterialDefectCount',
        key: 'rawMaterialDefectCount',
        width: 100,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
      },
      {
        title: '加工不良',
        dataIndex: 'processingDefectCount',
        key: 'processingDefectCount',
        width: 100,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
      },
      {
        title: '外协不良数',
        dataIndex: 'outsourceDefectCount',
        key: 'outsourceDefectCount',
        width: 110,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
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
        width: 100,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">{value}</span>
        ),
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
        width: 110,
        sorter: (a, b) => a.qualifiedRate - b.qualifiedRate,
        sortDirections: ['descend', 'ascend'],
        render: (value: number) => renderQualifiedRate(value),
      },
      {
        title: '原料不良重量kg',
        dataIndex: 'rawMaterialDefectWeightKg',
        key: 'rawMaterialDefectWeightKg',
        width: 130,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">
            {renderNumber(value, 2)}
          </span>
        ),
      },
      {
        title: '加工不良重量kg',
        dataIndex: 'processingDefectWeightKg',
        key: 'processingDefectWeightKg',
        width: 130,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">
            {renderNumber(value, 2)}
          </span>
        ),
      },
      {
        title: '外协不良重量kg',
        dataIndex: 'outsourceDefectWeightKg',
        key: 'outsourceDefectWeightKg',
        width: 140,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">
            {renderNumber(value, 2)}
          </span>
        ),
      },
      {
        title: '调机不良重量kg',
        dataIndex: 'setupDefectWeightKg',
        key: 'setupDefectWeightKg',
        width: 140,
        render: (value: number) => (
          <span className="text-slate-700 tabular-nums">
            {renderNumber(value, 2)}
          </span>
        ),
      },
      {
        title: '操作人',
        dataIndex: 'employeeName',
        key: 'employeeName',
        width: 130,
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

  const handleRow = useCallback(
    () => ({
      style: { height: rowHeight },
    }),
    [rowHeight],
  )

  return (
    <Table<ProductionDailyReportRow>
      rowKey={(record) => record.key}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      onRow={handleRow}
      pagination={false}
      virtual
      size="small"
      scroll={{ x: 2750, y: scrollY }}
      style={{ fontSize: '13px' }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50 dark:bg-slate-800/80">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={10}>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                当前页合计
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={11}>
              <span className="font-bold text-emerald-700 tabular-nums">
                {currentPageQualifiedCount.toLocaleString()}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={12}>
              <span className="font-bold text-rose-600 tabular-nums">
                {currentPageDefectCount.toLocaleString()}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={13} colSpan={14} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}

export default memo(ProductionDailyReportTable)
