import type { TableColumnsType } from 'antd'
import type { SyneyMaterialsMonthlyReportRow } from '@/services/apiSyneyMaterialsReport'
import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { renderText, zebraRowClassName } from '../display'
import { sumSyneyMaterialsReportRows } from './reportUtils'

export interface SyneyMaterialsMonthlyReportTableProps {
  loading: boolean
  data: SyneyMaterialsMonthlyReportRow[]
  scrollY?: number
  rowHeight?: number
}

/** 合计行合并 #、品名、规格、单位 四列 */
const TOTAL_LABEL_COLSPAN = 4

function renderQuantity(value: number | null | undefined) {
  const quantity = value ?? 0
  return (
    <span className={`tabular-nums ${quantity < 0 ? 'text-red-500' : ''}`}>
      {quantity}
    </span>
  )
}

function renderSignedQuantity(value: number | null | undefined) {
  const quantity = value ?? 0
  return (
    <span className={`tabular-nums ${quantity < 0 ? 'text-red-500' : ''}`}>
      {quantity > 0 ? `+${quantity}` : quantity}
    </span>
  )
}

const COLUMNS: TableColumnsType<SyneyMaterialsMonthlyReportRow> = [
  {
    title: '#',
    key: '#',
    width: 60,
    fixed: 'left',
    render: (_value, _record, index) => index + 1,
  },
  {
    title: '品名',
    dataIndex: 'material_name',
    key: 'material_name',
    width: 220,
  },
  {
    title: '规格',
    dataIndex: 'specification',
    key: 'specification',
    width: 180,
    render: renderText,
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
    width: 80,
    render: renderText,
  },
  {
    title: '上月结余',
    dataIndex: 'opening_quantity',
    key: 'opening_quantity',
    width: 110,
    align: 'right',
    render: renderQuantity,
  },
  {
    title: '本月入库',
    dataIndex: 'stock_in_quantity',
    key: 'stock_in_quantity',
    width: 110,
    align: 'right',
    render: renderQuantity,
  },
  {
    title: '本月出库',
    dataIndex: 'stock_out_quantity',
    key: 'stock_out_quantity',
    width: 110,
    align: 'right',
    render: renderQuantity,
  },
  {
    title: '本月调整',
    dataIndex: 'stock_adjust_quantity',
    key: 'stock_adjust_quantity',
    width: 110,
    align: 'right',
    render: renderSignedQuantity,
  },
  {
    title: '月末结存',
    dataIndex: 'closing_quantity',
    key: 'closing_quantity',
    width: 110,
    align: 'right',
    render: renderQuantity,
  },
]

export default function SyneyMaterialsMonthlyReportTable({
  loading,
  data,
  scrollY = 400,
  rowHeight = 40,
}: SyneyMaterialsMonthlyReportTableProps) {
  const totals = useMemo(() => sumSyneyMaterialsReportRows(data), [data])

  return (
    <Table<SyneyMaterialsMonthlyReportRow>
      rowKey="inventory_id"
      loading={loading}
      columns={COLUMNS}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1090, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无材料库存"
            description="库存行随材料资料自动生成"
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={() => ({ style: { height: rowHeight } })}
      summary={() =>
        data.length > 0
          ? (
              <Table.Summary fixed>
                <Table.Summary.Row className="font-semibold">
                  <Table.Summary.Cell index={0} colSpan={TOTAL_LABEL_COLSPAN}>
                    合计
                  </Table.Summary.Cell>
                  {totals.map((total, offset) => (
                    <Table.Summary.Cell
                      // eslint-disable-next-line react/no-array-index-key -- 合计列顺序固定
                      key={offset}
                      index={TOTAL_LABEL_COLSPAN + offset}
                      align="right"
                    >
                      {renderQuantity(total)}
                    </Table.Summary.Cell>
                  ))}
                </Table.Summary.Row>
              </Table.Summary>
            )
          : null}
    />
  )
}
