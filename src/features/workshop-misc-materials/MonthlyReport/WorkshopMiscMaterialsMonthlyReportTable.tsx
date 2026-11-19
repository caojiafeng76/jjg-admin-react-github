import type { TableColumnsType } from 'antd'
import type { WorkshopMiscMaterialsMonthlyReportRow } from '@/services/apiWorkshopMiscMaterialsReport'
import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { SUMMARY_ROW_CLASS_NAME, zebraRowClassName } from '@/ui/tableStyles'
import { formatQuantity, formatSignedQuantity, renderText } from '../display'
import { sumWorkshopMiscReportRows } from './reportUtils'

export interface WorkshopMiscMaterialsMonthlyReportTableProps {
  loading: boolean
  data: WorkshopMiscMaterialsMonthlyReportRow[]
  scrollY?: number
  rowHeight?: number
}

/** 合计行合并 #、型号、客户型号、规格、类别 五列 */
const TOTAL_LABEL_COLSPAN = 5

function renderReportQuantity(value: number | null | undefined) {
  const quantity = value ?? 0
  return (
    <span className={`tabular-nums ${quantity < 0 ? 'text-error' : ''}`}>
      {formatQuantity(quantity)}
    </span>
  )
}

function renderReportSignedQuantity(value: number | null | undefined) {
  const quantity = value ?? 0
  return (
    <span className={`tabular-nums ${quantity < 0 ? 'text-error' : ''}`}>
      {formatSignedQuantity(quantity)}
    </span>
  )
}

const COLUMNS: TableColumnsType<WorkshopMiscMaterialsMonthlyReportRow> = [
  {
    title: '#',
    key: '#',
    width: 60,
    fixed: 'left',
    render: (_value, _record, index) => index + 1,
  },
  {
    title: '型号',
    dataIndex: 'model',
    key: 'model',
    width: 160,
    fixed: 'left',
  },
  {
    title: '客户型号',
    dataIndex: 'customer_model',
    key: 'customer_model',
    width: 160,
    render: renderText,
  },
  {
    title: '规格',
    dataIndex: 'specification',
    key: 'specification',
    width: 160,
    render: renderText,
  },
  {
    title: '类别',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    render: renderText,
  },
  {
    title: '上月结余',
    dataIndex: 'opening_quantity',
    key: 'opening_quantity',
    width: 110,
    align: 'right',
    render: renderReportQuantity,
  },
  {
    title: '本月入库',
    dataIndex: 'stock_in_quantity',
    key: 'stock_in_quantity',
    width: 110,
    align: 'right',
    render: renderReportQuantity,
  },
  {
    title: '本月出库',
    dataIndex: 'stock_out_quantity',
    key: 'stock_out_quantity',
    width: 110,
    align: 'right',
    render: renderReportQuantity,
  },
  {
    title: '本月调整',
    dataIndex: 'stock_adjust_quantity',
    key: 'stock_adjust_quantity',
    width: 110,
    align: 'right',
    render: renderReportSignedQuantity,
  },
  {
    title: '月末结存',
    dataIndex: 'closing_quantity',
    key: 'closing_quantity',
    width: 110,
    align: 'right',
    render: renderReportQuantity,
  },
]

export default function WorkshopMiscMaterialsMonthlyReportTable({
  loading,
  data,
  scrollY = 400,
  rowHeight = 40,
}: WorkshopMiscMaterialsMonthlyReportTableProps) {
  const totals = useMemo(() => sumWorkshopMiscReportRows(data), [data])

  return (
    <Table<WorkshopMiscMaterialsMonthlyReportRow>
      rowKey="inventory_id"
      loading={loading}
      columns={COLUMNS}
      dataSource={data}
      pagination={false}
      scroll={data.length > 0 ? { x: 1210, y: scrollY } : { x: 1210 }}
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
                <Table.Summary.Row className={SUMMARY_ROW_CLASS_NAME}>
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
                      {offset === 3
                        ? renderReportSignedQuantity(total)
                        : renderReportQuantity(total)}
                    </Table.Summary.Cell>
                  ))}
                </Table.Summary.Row>
              </Table.Summary>
            )
          : null}
    />
  )
}
