import { useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { JintanPartsStockOut } from '@/services/apiJintanPartsStockOut'
import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'

interface Props {
  data: JintanPartsStockOut[]
  loading: boolean
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY: number
  rowHeight: number
  emptyAction?: React.ReactNode
}

export default function JintanPartsStockOutTable({
  data,
  loading,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY,
  rowHeight,
  emptyAction,
}: Props) {
  const columns: TableColumnsType<JintanPartsStockOut> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      { title: '名称', dataIndex: 'part_name', width: 200, fixed: 'left' },
      {
        title: '规格',
        dataIndex: 'specification',
        width: 150,
        render: (value: string) => value || '-',
      },
      {
        title: '材质',
        dataIndex: 'material',
        width: 120,
        render: (value: string) => value || '-',
      },
      {
        title: '采购厂家',
        dataIndex: 'supplier',
        width: 150,
        render: (value: string) => value || '-',
      },
      {
        title: '出库数量',
        dataIndex: 'quantity',
        width: 110,
        align: 'right',
        render: (value: number) => (
          <span className="font-medium text-red-600 tabular-nums">
            -{value}
          </span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        width: 220,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '出库时间',
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString('zh-CN'),
      },
    ],
    [page, pageSize],
  )

  return (
    <Table<JintanPartsStockOut>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'radio', selectedRowKeys, onChange: onSelect }}
      pagination={false}
      scroll={{ x: 1190, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无配件出库记录"
            description="点击下方按钮创建第一条配件出库"
            action={emptyAction}
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择出库记录 ${record.part_name}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
