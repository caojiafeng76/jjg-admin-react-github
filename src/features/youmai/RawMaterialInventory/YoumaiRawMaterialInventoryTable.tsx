import { memo, useMemo } from 'react'
import { Tag, Table, type TableColumnsType } from 'antd'

import type { YoumaiRawMaterialInventory } from '@/services/apiYoumaiRawMaterialInventory'
import { TableEmpty } from '@/ui/TableState'

interface Props {
  loading: boolean
  data: YoumaiRawMaterialInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  /** 空态引导动作（通常为新建按钮），透传给 TableEmpty */
  emptyAction?: React.ReactNode
}

function QuantityCell({ quantity }: { quantity: number }) {
  if (quantity < 50) {
    return (
      <Tag color="red" className="font-semibold">
        {quantity}
      </Tag>
    )
  }
  if (quantity < 100) {
    return (
      <Tag color="gold" className="font-semibold">
        {quantity}
      </Tag>
    )
  }
  return <span>{quantity}</span>
}

function YoumaiRawMaterialInventoryTable({
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
  const columns: TableColumnsType<YoumaiRawMaterialInventory> = useMemo(
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
        title: '库存数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 140,
        align: 'right',
        sorter: (a, b) => a.quantity - b.quantity,
        render: (value: number) => <QuantityCell quantity={value} />,
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
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
      scroll={{ x: 800, y: estimatedHeight || scrollY }}
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无原料库存"
            description="点击下方按钮创建第一条原料库存"
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

export default memo(YoumaiRawMaterialInventoryTable)
