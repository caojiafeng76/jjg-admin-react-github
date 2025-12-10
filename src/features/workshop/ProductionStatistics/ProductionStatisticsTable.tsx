import { useMemo } from 'react'
import { Table, type TableColumnsType, Tag } from 'antd'

import type { ProductionStatisticsRow } from './useProductionStatistics'

interface Props {
  loading: boolean
  data: ProductionStatisticsRow[]
  defectReasonColumns: string[]
  processColumns: string[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
}

export default function ProductionStatisticsTable({
  loading,
  data,
  defectReasonColumns,
  processColumns,
  selectedRowKeys,
  onSelect,
  scrollY = 520,
}: Props) {
  const columns: TableColumnsType<ProductionStatisticsRow> = useMemo(() => {
    const baseColumns: TableColumnsType<ProductionStatisticsRow> = [
      {
        title: '#',
        dataIndex: 'index',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '项目号',
        dataIndex: 'projectNo',
        width: 140,
        fixed: 'left',
      },
      {
        title: '产品型号',
        dataIndex: 'productModel',
        width: 140,
        fixed: 'left',
      },
      {
        title: '客户型号',
        dataIndex: 'customerModel',
        width: 140,
      },
      {
        title: '长度(mm)',
        dataIndex: 'lengthMm',
        width: 100,
        render: (value: number | null | undefined) =>
          value ? value.toLocaleString() : '-',
      },
      {
        title: '日期范围',
        dataIndex: 'dateRange',
        width: 200,
      },
      {
        title: '合格数量',
        dataIndex: 'qualifiedQuantity',
        width: 120,
        align: 'right',
        render: (value: number) => value.toLocaleString(),
      },
      {
        title: '不合格总数',
        dataIndex: 'defectiveQuantity',
        width: 120,
        align: 'right',
        render: (value: number) => value.toLocaleString(),
      },
      {
        title: '不合格重量(kg)',
        dataIndex: 'defectiveWeightKg',
        width: 140,
        align: 'right',
        render: (value: number) => (value ? value.toFixed(2) : '-'),
      },
    ]

    const processQuantityColumns: TableColumnsType<ProductionStatisticsRow> =
      processColumns.map((process) => ({
        title: `${process}-合格数`,
        dataIndex: ['processQualifiedCounts', process],
        width: 140,
        align: 'right',
        render: (_value, record) => {
          const qty = record.processQualifiedCounts[process] || 0
          return qty > 0 ? qty.toLocaleString() : ''
        },
      }))

    const reasonColumns: TableColumnsType<ProductionStatisticsRow> =
      defectReasonColumns.map((reason) => ({
        title: reason,
        dataIndex: ['defectReasonCounts', reason],
        width: 120,
        align: 'right',
        render: (_value, record) => {
          const qty = record.defectReasonCounts[reason] || 0
          return qty > 0 ? qty.toLocaleString() : ''
        },
      }))

    const tailColumns: TableColumnsType<ProductionStatisticsRow> = [
      {
        title: '操作人',
        dataIndex: 'operators',
        width: 180,
        render: (operators: string[]) =>
          operators && operators.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {operators.map((op) => (
                <Tag key={op}>{op}</Tag>
              ))}
            </div>
          ) : (
            '-'
          ),
      },
    ]

    return [...baseColumns, ...processQuantityColumns, ...reasonColumns, ...tailColumns]
  }, [defectReasonColumns, processColumns])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [selectedRowKeys, onSelect],
  )

  const summaryNode = useMemo(() => {
    const totalQualified = data.reduce(
      (sum, row) => sum + (row.qualifiedQuantity || 0),
      0,
    )
    const totalDefective = data.reduce(
      (sum, row) => sum + (row.defectiveQuantity || 0),
      0,
    )
    const totalDefectiveWeight = data.reduce(
      (sum, row) => sum + (row.defectiveWeightKg || 0),
      0,
    )

    const reasonTotals = defectReasonColumns.reduce<Record<string, number>>(
      (acc, reason) => {
        acc[reason] = data.reduce(
          (sum, row) => sum + (row.defectReasonCounts[reason] || 0),
          0,
        )
        return acc
      },
      {},
    )

    const processTotals = processColumns.reduce<Record<string, number>>(
      (acc, process) => {
        acc[process] = data.reduce(
          (sum, row) => sum + (row.processQualifiedCounts[process] || 0),
          0,
        )
        return acc
      },
      {},
    )

    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          {/* 选择框列 */}
          <Table.Summary.Cell index={0} />
          {/* #、项目号、产品型号、客户型号、长度、日期范围 共6列 */}
          <Table.Summary.Cell index={1} colSpan={6}>
            汇总
          </Table.Summary.Cell>
          <Table.Summary.Cell index={7} align="right">
            {totalQualified.toLocaleString()}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={8} align="right">
            {totalDefective.toLocaleString()}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={9} align="right">
            {totalDefectiveWeight > 0 ? totalDefectiveWeight.toFixed(2) : ''}
          </Table.Summary.Cell>
          {processColumns.map((process, idx) => (
            <Table.Summary.Cell
              key={process}
              index={10 + idx}
              align="right"
            >
              {processTotals[process] > 0
                ? processTotals[process].toLocaleString()
                : ''}
            </Table.Summary.Cell>
          ))}
          {defectReasonColumns.map((reason, idx) => (
            <Table.Summary.Cell
              key={reason}
              index={10 + processColumns.length + idx}
              align="right"
            >
              {reasonTotals[reason] > 0 ? reasonTotals[reason].toLocaleString() : ''}
            </Table.Summary.Cell>
          ))}
          {/* 操作人列 */}
          <Table.Summary.Cell
            index={10 + processColumns.length + defectReasonColumns.length}
            align="center"
          />
        </Table.Summary.Row>
      </Table.Summary>
    )
  }, [data, defectReasonColumns, processColumns])

  return (
    <Table<ProductionStatisticsRow>
      rowKey={(record) => record.key}
      loading={loading}
      dataSource={data}
      columns={columns}
      size="small"
      rowSelection={rowSelection}
      scroll={{ x: 'max-content', y: scrollY }}
      pagination={false}
      summary={() => summaryNode}
    />
  )
}

