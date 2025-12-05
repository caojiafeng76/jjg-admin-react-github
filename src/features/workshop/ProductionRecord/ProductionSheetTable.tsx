import React, { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { ProductionSheetWithRecords } from '@/services/apiProductionSheets'

interface Props {
  loading: boolean
  data: ProductionSheetWithRecords[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  onViewDetail?: (sheetId: string) => void
}

export default function ProductionSheetTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  onViewDetail,
}: Props) {
  const columns: TableColumnsType<ProductionSheetWithRecords> = useMemo(
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
        title: '记录数',
        dataIndex: 'record_count',
        key: 'record_count',
        width: 100,
        align: 'center',
        render: (count: number) => count || 0,
      },
      {
        title: '合格总数',
        dataIndex: 'total_qualified_quantity',
        key: 'total_qualified_quantity',
        width: 120,
        align: 'right',
        render: (value: number) => (value || 0).toLocaleString(),
      },
      {
        title: '不良总数',
        dataIndex: 'total_defective_quantity',
        key: 'total_defective_quantity',
        width: 120,
        align: 'right',
        render: (value: number) => (value || 0).toLocaleString(),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
        ellipsis: true,
        render: (text: string) => text || '-',
      },
      {
        title: '操作者',
        dataIndex: 'operators',
        key: 'operators',
        width: 200,
        ellipsis: true,
        render: (ops?: { id: string; name: string }[]) => {
          if (!ops || ops.length === 0) return '-'
          return ops.map((o) => o.name).join('、')
        },
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
      {
        title: '操作',
        key: 'action',
        width: 100,
        fixed: 'right',
        render: (_text, record) => (
          <a onClick={() => onViewDetail?.(record.id!)}>查看详情</a>
        ),
      },
    ],
    [page, pageSize, onViewDetail],
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

  const components = useMemo(
    () => ({
      body: {
        cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => {
          const { children, style, ...restProps } = props
          return (
            <td
              {...restProps}
              style={{
                ...style,
                height: `${rowHeight}px`,
              }}
            >
              {children}
            </td>
          )
        },
      },
    }),
    [rowHeight],
  )

  return (
    <Table<ProductionSheetWithRecords>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 'max-content', y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
