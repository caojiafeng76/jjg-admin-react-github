import type { TableColumnsType } from 'antd'
import type { JintanMonthlyReportRow } from '@/services/apiJintanMonthlyReport'
import { Table } from 'antd'

import { useMemo } from 'react'
import { TableEmpty } from '@/ui/TableState'
import { sumJintanMonthlyReportRows } from './reportUtils'

export interface JintanMonthlyReportTableProps {
  loading: boolean
  data: JintanMonthlyReportRow[]
  categoryLabel: string
  scrollY?: number
  rowHeight?: number
}

function renderText(value: string | null | undefined) {
  return value || '-'
}

function renderQuantity(value: number | null | undefined) {
  const quantity = value ?? 0
  return (
    <span className={`tabular-nums ${quantity < 0 ? 'text-red-500' : ''}`}>
      {quantity}
    </span>
  )
}

export default function JintanMonthlyReportTable({
  loading,
  data,
  categoryLabel,
  scrollY = 400,
  rowHeight = 40,
}: JintanMonthlyReportTableProps) {
  const columns: TableColumnsType<JintanMonthlyReportRow> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '型号',
        dataIndex: 'item_model',
        key: 'item_model',
        width: 160,
        render: renderText,
      },
      {
        title: '名称',
        dataIndex: 'item_name',
        key: 'item_name',
        width: 200,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 160,
        render: renderText,
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 120,
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
        title: '月末结存',
        dataIndex: 'closing_quantity',
        key: 'closing_quantity',
        width: 110,
        align: 'right',
        render: renderQuantity,
      },
    ],
    [],
  )

  const totals = useMemo(() => sumJintanMonthlyReportRows(data), [data])

  return (
    <Table<JintanMonthlyReportRow>
      rowKey="inventory_id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1100, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title={`暂无${categoryLabel}库存`}
            description={`库存行随${categoryLabel}资料自动生成`}
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'}
      onRow={() => ({ style: { height: rowHeight } })}
      summary={() =>
        data.length > 0
          ? (
              <Table.Summary fixed>
                <Table.Summary.Row className="font-semibold">
                  <Table.Summary.Cell index={0} colSpan={5}>
                    合计
                  </Table.Summary.Cell>
                  {totals.map((total, offset) => (
                    <Table.Summary.Cell
                      // eslint-disable-next-line react/no-array-index-key -- 合计列顺序固定
                      key={offset}
                      index={5 + offset}
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
