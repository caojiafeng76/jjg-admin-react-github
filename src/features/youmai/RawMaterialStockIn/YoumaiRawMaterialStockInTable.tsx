import { useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { YoumaiRawMaterialStockIn } from '@/services/apiYoumaiRawMaterialStockIn'
import { TableEmpty } from '@/ui/TableState'

interface Props {
  loading: boolean
  data: YoumaiRawMaterialStockIn[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  /** 空态引导动作（通常为新建按钮），透传给 TableEmpty */
  emptyAction?: React.ReactNode
}

export default function YoumaiRawMaterialStockInTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  emptyAction,
}: Props) {
  const columns: TableColumnsType<YoumaiRawMaterialStockIn> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_v, _r, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 200,
        fixed: 'left',
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 200,
      },
      {
        title: '入库数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 120,
        align: 'right',
        render: (value: number) => (
          <span className="font-medium text-green-600">+{value}</span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ],
    [page, pageSize],
  )

  const estimatedHeight = Math.min(data.length * rowHeight, scrollY)

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 900, y: estimatedHeight || scrollY }}
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无原料入库"
            description="点击下方按钮创建第一条原料入库"
            action={emptyAction}
          />
        ),
      }}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelect,
      }}
    />
  )
}
