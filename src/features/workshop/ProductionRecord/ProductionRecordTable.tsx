import { useMemo } from 'react'
import { Table, TableColumnsType, Tag } from 'antd'
import dayjs from 'dayjs'
import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'

interface Props {
  loading: boolean
  data: ProductionRecordWithRelations[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
}

export default function ProductionRecordTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
}: Props) {
  const columns: TableColumnsType<ProductionRecordWithRelations> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '日期',
        dataIndex: 'production_date',
        key: 'production_date',
        width: 120,
        fixed: 'left',
        render: (text: string) => {
          if (!text) return '-'
          return dayjs(text).format('YYYY-MM-DD')
        },
      },
      {
        title: '订单',
        key: 'order',
        width: 250,
        fixed: 'left',
        render: (_text, record) => {
          if (record.order) {
            const parts = [
              record.order.project_no || '',
              record.order.product_model || '',
            ].filter(Boolean)
            const orderInfo = parts.join(' - ')
            const lengthInfo = record.order.length_mm
              ? `(${record.order.length_mm}mm)`
              : ''
            return `${orderInfo} ${lengthInfo}`.trim()
          }
          return '-'
        },
      },
      {
        title: '工序',
        key: 'process',
        width: 150,
        render: (_text, record) => {
          return record.process?.process_name || '-'
        },
      },
      {
        title: '合格数量',
        dataIndex: 'qualified_quantity',
        key: 'qualified_quantity',
        width: 100,
        align: 'right',
      },
      {
        title: '不良总数',
        dataIndex: 'defective_quantity',
        key: 'defective_quantity',
        width: 100,
        align: 'right',
      },
      {
        title: '不良原因',
        key: 'defect_reasons',
        width: 300,
        render: (_text, record) => {
          if (
            record.defect_reasons_with_details &&
            record.defect_reasons_with_details.length > 0
          ) {
            return (
              <div className="space-y-1">
                {record.defect_reasons_with_details.map(
                  (item: any, index: number) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">
                        {item.defect_reason?.defect_reason || '未知原因'}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ×{item.quantity}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )
          }
          return '-'
        },
      },
      {
        title: '工时（H）',
        dataIndex: 'working_hours',
        key: 'working_hours',
        width: 100,
        align: 'right',
        render: (value: number | null | undefined) => {
          if (value === null || value === undefined) return '-'
          return value.toFixed(1)
        },
      },
      {
        title: '操作者',
        key: 'operators',
        width: 200,
        render: (_text, record) => {
          if (record.operators && record.operators.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {record.operators.map((operator) => (
                  <Tag key={operator.id}>{operator.name}</Tag>
                ))}
              </div>
            )
          }
          return '-'
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        ellipsis: true,
        render: (text: string) => text || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => {
        onSelect(keys)
      },
    }),
    [selectedRowKeys, onSelect],
  )

  // 计算汇总数据
  const summary = (pageData: readonly ProductionRecordWithRelations[]) => {
    const totalQualified = pageData.reduce(
      (sum, record) => sum + (record.qualified_quantity || 0),
      0,
    )
    const totalDefective = pageData.reduce(
      (sum, record) => sum + (record.defective_quantity || 0),
      0,
    )
    const totalWorkingHours = pageData.reduce(
      (sum, record) => sum + (record.working_hours || 0),
      0,
    )

    // 实际列索引（包含选择框列）：0=选择框, 1=#, 2=日期, 3=订单, 4=工序, 5=合格数量, 6=不良总数, 7=不良原因, 8=工时, 9=操作者, 10=备注, 11=创建时间
    // 汇总行需要对齐到：合格数量(5)、不良总数(6) 和 工时(8) 列
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          {/* 选择框列 (index 0) */}
          <Table.Summary.Cell index={0} />
          {/* 合并 #、日期、订单、工序 (index 1-4)，占用4列 */}
          <Table.Summary.Cell index={1} colSpan={4} />
          {/* 合格数量列 (index 5) */}
          <Table.Summary.Cell index={5} align="right">
            <span className="font-medium">
              {totalQualified.toLocaleString()}
            </span>
          </Table.Summary.Cell>
          {/* 不良总数列 (index 6) */}
          <Table.Summary.Cell index={6} align="right">
            <span className="font-medium">
              {totalDefective.toLocaleString()}
            </span>
          </Table.Summary.Cell>
          {/* 不良原因列 (index 7) */}
          <Table.Summary.Cell index={7} />
          {/* 工时列 (index 8) */}
          <Table.Summary.Cell index={8} align="right">
            <span className="font-medium">
              {totalWorkingHours > 0 ? totalWorkingHours.toFixed(1) : '-'}
            </span>
          </Table.Summary.Cell>
          {/* 合并剩余列：操作者、备注、创建时间 (index 9-11) */}
          <Table.Summary.Cell index={9} colSpan={3} />
        </Table.Summary.Row>
      </Table.Summary>
    )
  }

  return (
    <Table<ProductionRecordWithRelations>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 'max-content', y: 'calc(100vh - 260px)' as any }}
      size="small"
      pagination={false}
      summary={summary}
      style={{
        fontSize: '12px',
      }}
    />
  )
}
