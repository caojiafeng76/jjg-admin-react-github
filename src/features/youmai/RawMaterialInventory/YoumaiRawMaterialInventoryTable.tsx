import { useMemo } from 'react'
import { Tag, Table, type TableColumnsType } from 'antd'

import type { YoumaiRawMaterialInventory } from '@/services/apiYoumaiRawMaterialInventory'

interface Props {
  loading: boolean
  data: YoumaiRawMaterialInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
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

export default function YoumaiRawMaterialInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
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
      rowSelection={{
        selectedRowKeys,
        onChange: onSelect,
      }}
    />
  )
}
