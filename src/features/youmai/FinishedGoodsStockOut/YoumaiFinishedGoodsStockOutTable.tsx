import { memo, useMemo } from 'react'
import { Table, Tag, type TableColumnsType } from 'antd'

import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'
import { formatNumber } from '@/utils/format'

function uniqueFilters(
  values: (string | number | null | undefined)[],
): { text: string; value: string | number }[] {
  const set = new Set<string | number>()
  values.forEach((v) => {
    if (v !== null && v !== undefined && v !== '') {
      set.add(typeof v === 'number' ? v : String(v))
    }
  })
  return Array.from(set)
    .sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true }),
    )
    .map((v) => ({ text: String(v), value: v }))
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

function YoumaiFinishedGoodsStockOutTable({
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
        sorter: (a, b) => (a.status ?? '').localeCompare(b.status ?? ''),
        filters: [
          { text: '待审核', value: '待审核' },
          { text: '已审核', value: '已审核' },
        ],
        onFilter: (value, record) => record.status === value,
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
        sorter: (a, b) =>
          (a.delivery_date ?? '').localeCompare(b.delivery_date ?? ''),
        filters: uniqueFilters(data.map((r) => r.delivery_date)),
        onFilter: (value, record) =>
          String(record.delivery_date ?? '') === String(value),
        render: (value: string) => value || '-',
      },
      {
        title: '采购订单号',
        dataIndex: 'purchase_order_no',
        key: 'purchase_order_no',
        width: 160,
        sorter: (a, b) =>
          (a.purchase_order_no ?? '').localeCompare(
            b.purchase_order_no ?? '',
          ),
        filters: uniqueFilters(data.map((r) => r.purchase_order_no)),
        onFilter: (value, record) =>
          String(record.purchase_order_no ?? '') === String(value),
      },
      {
        title: '行号',
        dataIndex: 'purchase_order_line_no',
        key: 'purchase_order_line_no',
        width: 72,
        sorter: (a, b) =>
          Number(a.purchase_order_line_no ?? 0) -
          Number(b.purchase_order_line_no ?? 0),
        filters: uniqueFilters(data.map((r) => r.purchase_order_line_no)),
        onFilter: (value, record) =>
          String(record.purchase_order_line_no ?? '') === String(value),
      },
      {
        title: '物料编码',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 140,
        sorter: (a, b) =>
          (a.material_code ?? '').localeCompare(b.material_code ?? ''),
        filters: uniqueFilters(data.map((r) => r.material_code)),
        onFilter: (value, record) =>
          String(record.material_code ?? '') === String(value),
      },
      {
        title: '物料名称',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 160,
        sorter: (a, b) =>
          (a.material_name ?? '').localeCompare(b.material_name ?? ''),
        filters: uniqueFilters(data.map((r) => r.material_name)),
        onFilter: (value, record) =>
          String(record.material_name ?? '') === String(value),
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 100,
        sorter: (a, b) => (a.model ?? '').localeCompare(b.model ?? ''),
        filters: uniqueFilters(data.map((r) => r.model)),
        onFilter: (value, record) =>
          String(record.model ?? '') === String(value),
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 120,
        sorter: (a, b) =>
          (a.specification ?? '').localeCompare(b.specification ?? ''),
        filters: uniqueFilters(data.map((r) => r.specification)),
        onFilter: (value, record) =>
          String(record.specification ?? '') === String(value),
      },
      {
        title: '出库数量',
        dataIndex: 'stock_out_quantity',
        key: 'stock_out_quantity',
        width: 100,
        sorter: (a, b) =>
          (a.stock_out_quantity ?? 0) - (b.stock_out_quantity ?? 0),
        filters: uniqueFilters(data.map((r) => r.stock_out_quantity)),
        onFilter: (value, record) =>
          String(record.stock_out_quantity ?? '') === String(value),
        render: (value: number) => formatNumber(value),
      },
      {
        title: '比重',
        dataIndex: 'specific_gravity',
        key: 'specific_gravity',
        width: 100,
        sorter: (a, b) =>
          (a.specific_gravity ?? 0) - (b.specific_gravity ?? 0),
        filters: uniqueFilters(data.map((r) => r.specific_gravity)),
        onFilter: (value, record) =>
          String(record.specific_gravity ?? '') === String(value),
        render: (value: number) => formatNumber(value, 6),
      },
      {
        title: '重量(KG)',
        key: 'weight_kg',
        width: 110,
        sorter: (a, b) => {
          const wa =
            calculateYoumaiWeightKg({
              specification: a.specification,
              specificGravity: a.specific_gravity,
              quantity: a.stock_out_quantity,
            }) ?? 0
          const wb =
            calculateYoumaiWeightKg({
              specification: b.specification,
              specificGravity: b.specific_gravity,
              quantity: b.stock_out_quantity,
            }) ?? 0
          return wa - wb
        },
        filters: uniqueFilters(
          data.map((r) => {
            const w = calculateYoumaiWeightKg({
              specification: r.specification,
              specificGravity: r.specific_gravity,
              quantity: r.stock_out_quantity,
            })
            return w === null ? '-' : formatNumber(w)
          }),
        ),
        onFilter: (value, record) => {
          const w = calculateYoumaiWeightKg({
            specification: record.specification,
            specificGravity: record.specific_gravity,
            quantity: record.stock_out_quantity,
          })
          const text = w === null ? '-' : formatNumber(w)
          return text === String(value)
        },
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
        sorter: (a, b) => (a.final_stock ?? 0) - (b.final_stock ?? 0),
        filters: uniqueFilters(data.map((r) => r.final_stock)),
        onFilter: (value, record) =>
          String(record.final_stock ?? '') === String(value),
        render: (value: number | null | undefined) =>
          value === null || value === undefined ? '-' : formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        sorter: (a, b) =>
          (a.remarks ?? '').localeCompare(b.remarks ?? ''),
        filters: uniqueFilters(data.map((r) => r.remarks)),
        onFilter: (value, record) =>
          String(record.remarks ?? '') === String(value),
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        sorter: (a, b) =>
          (a.updated_at ?? '').localeCompare(b.updated_at ?? ''),
        filters: uniqueFilters(data.map((r) => r.updated_at)),
        onFilter: (value, record) =>
          String(record.updated_at ?? '') === String(value),
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ],
    [page, pageSize, data],
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

export default memo(YoumaiFinishedGoodsStockOutTable)
