import { memo, useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, type TableColumnsType } from 'antd'

import type { YoumaiFinishedGoodsInventory } from '@/services/apiYoumaiFinishedGoodsInventory'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'
import { formatNumber } from '@/utils/format'

function getFinalStockColorClass(value: number | null | undefined) {
  const stock = Number(value ?? 0)

  if (stock < 20) return 'text-red-600'
  if (stock < 50) return 'text-yellow-600'
  if (stock < 100) return 'text-orange-600'
  return 'text-green-600'
}

interface Props {
  loading: boolean
  data: YoumaiFinishedGoodsInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function YoumaiFinishedGoodsInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<YoumaiFinishedGoodsInventory> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '物料编码',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 180,
        fixed: 'left',
      },
      {
        title: '物料名称',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 180,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 140,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 140,
      },
      {
        title: '比重',
        dataIndex: 'specific_gravity',
        key: 'specific_gravity',
        width: 120,
        render: (value: number) => formatNumber(value, 6),
      },
      {
        title: '待入库',
        dataIndex: 'pending_stock_in',
        key: 'pending_stock_in',
        width: 120,
        render: (value: number) => (
          <span className="text-slate-400">{formatNumber(value)}</span>
        ),
      },
      {
        title: '现有库存',
        dataIndex: 'current_stock',
        key: 'current_stock',
        width: 120,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '重量(KG)',
        key: 'weight_kg',
        width: 140,
        render: (_value, record) => {
          const weight = calculateYoumaiWeightKg({
            specification: record.specification,
            specificGravity: record.specific_gravity,
            quantity: record.current_stock,
          })

          return weight === null ? '-' : formatNumber(weight)
        },
      },
      {
        title: '待出库',
        dataIndex: 'pending_stock_out',
        key: 'pending_stock_out',
        width: 120,
        render: (value: number) => (
          <span className="text-slate-400">{formatNumber(value)}</span>
        ),
      },
      {
        title: '最终库存',
        dataIndex: 'final_stock',
        key: 'final_stock',
        width: 120,
        render: (value: number) => (
          <span className={`${getFinalStockColorClass(value)} font-medium`}>
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 240,
        render: (value: string | null | undefined) => value || '-',
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

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<YoumaiFinishedGoodsInventory>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1960, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择优迈成品库存 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

export default memo(YoumaiFinishedGoodsInventoryTable)
