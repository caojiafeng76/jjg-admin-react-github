import { useMemo } from 'react'
import { Table, Tag, type TableColumnsType } from 'antd'

import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
}

interface Props {
  loading: boolean
  data: YoumaiFinishedGoodsStockOut[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function YoumaiFinishedGoodsStockOutTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<YoumaiFinishedGoodsStockOut> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 52,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        fixed: 'left',
        render: (value: YoumaiFinishedGoodsStockOut['status']) => (
          <Tag color={value === '已审核' ? 'success' : 'default'}>{value}</Tag>
        ),
      },
      {
        title: '交货日期',
        dataIndex: 'delivery_date',
        key: 'delivery_date',
        width: 118,
        fixed: 'left',
        render: (value: string) => value || '-',
      },
      {
        title: '采购订单号',
        dataIndex: 'purchase_order_no',
        key: 'purchase_order_no',
        width: 160,
      },
      {
        title: '行号',
        dataIndex: 'purchase_order_line_no',
        key: 'purchase_order_line_no',
        width: 72,
      },
      {
        title: '物料编码',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 140,
      },
      {
        title: '物料名称',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 160,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 100,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 120,
      },
      {
        title: '出库数量',
        dataIndex: 'stock_out_quantity',
        key: 'stock_out_quantity',
        width: 100,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '比重',
        dataIndex: 'specific_gravity',
        key: 'specific_gravity',
        width: 100,
        render: (value: number) => formatNumber(value, 6),
      },
      {
        title: '重量(KG)',
        key: 'weight_kg',
        width: 110,
        render: (_value, record) => {
          const weight = calculateYoumaiWeightKg({
            specification: record.specification,
            specificGravity: record.specific_gravity,
            quantity: record.stock_out_quantity,
          })

          return weight === null ? '-' : formatNumber(weight)
        },
      },
      {
        title: '最终库存',
        dataIndex: 'final_stock',
        key: 'final_stock',
        width: 100,
        render: (value: number | null | undefined) =>
          value === null || value === undefined ? '-' : formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
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
    <Table<YoumaiFinishedGoodsStockOut>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1692, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
