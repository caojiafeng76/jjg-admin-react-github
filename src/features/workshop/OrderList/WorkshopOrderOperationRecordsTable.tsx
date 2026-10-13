import { Table } from 'antd'

import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'
import {
  recordColumns,
  type OperationSummary,
} from './workshopOrderProductionStatsColumns'

export interface WorkshopOrderOperationRecordsTableProps {
  group: OperationSummary
}

export default function WorkshopOrderOperationRecordsTable({
  group,
}: WorkshopOrderOperationRecordsTableProps) {
  return (
    <div className="rounded-lg border border-slate-200/50 bg-white/50 p-2 dark:border-slate-700/50 dark:bg-slate-800/30">
      <Table<ProductionItemWithOrderDetail>
        rowKey="id"
        columns={recordColumns}
        dataSource={group.items}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content', y: 180 }}
        style={{ fontSize: 11 }}
        className="shadow-sm"
        summary={() => {
          const totalDefect1 = group.items.reduce(
            (sum, item) => sum + (item.defect_quantity_1 ?? 0),
            0,
          )
          const totalDefect2 = group.items.reduce(
            (sum, item) => sum + (item.defect_quantity_2 ?? 0),
            0,
          )
          const totalOutsourceDefect = group.items.reduce(
            (sum, item) => sum + (item.outsource_defect_quantity ?? 0),
            0,
          )
          const totalSetupDefect = group.items.reduce(
            (sum, item) => sum + (item.setup_defect_quantity ?? 0),
            0,
          )

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <Table.Summary.Cell index={0} colSpan={3}>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    合计（{group.items.length} 条）
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {group.totalIncoming}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span className="text-xs font-semibold text-green-600">
                    {group.totalQualified}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} align="right">
                  {totalDefect1 > 0 ? (
                    <span className="text-xs font-semibold text-red-500">
                      {totalDefect1}
                    </span>
                  ) : (
                    '-'
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} align="right">
                  {totalDefect2 > 0 ? (
                    <span className="text-xs font-semibold text-red-500">
                      {totalDefect2}
                    </span>
                  ) : (
                    '-'
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  {totalOutsourceDefect > 0 ? (
                    <span className="text-xs font-semibold text-red-500">
                      {totalOutsourceDefect}
                    </span>
                  ) : (
                    '-'
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} />
                <Table.Summary.Cell index={11} />
                <Table.Summary.Cell index={12} align="right">
                  {totalSetupDefect > 0 ? (
                    <span className="text-xs font-semibold text-red-500">
                      {totalSetupDefect}
                    </span>
                  ) : (
                    '-'
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} />
                <Table.Summary.Cell index={14} />
              </Table.Summary.Row>
            </Table.Summary>
          )
        }}
      />
    </div>
  )
}
