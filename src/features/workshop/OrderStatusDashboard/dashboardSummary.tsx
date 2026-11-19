import type { TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import type { DashboardSummary } from './dashboardUtils'
import type {
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'

import { Space, Table, Typography } from 'antd'
import StatusPill from '@/ui/StatusPill'
import { STATUS_TONE } from './dashboardColumns'
import { renderReworkRepairStatus } from './dashboardRenderUtils'
import {
  buildDashboardSummary,
  getColumnKey,
  PRODUCTION_STATUS_OPTIONS,
} from './dashboardUtils'

const { Text } = Typography

const JOB_COLUMN_KEY_PREFIX = 'job-'

/** 汇总行单元格：与 DenseBodyCell 同字号/内边距，底色不透明以便固定列遮住横向滚动内容 */
const SUMMARY_CELL_CLASS_NAME
  = 'bg-slate-50! px-1.5! py-1! text-xs! leading-tight! dark:bg-slate-800!'

function renderSummaryNumber(value: number, { dangerWhenNegative = false } = {}) {
  if (value === 0) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Text strong type={dangerWhenNegative && value < 0 ? 'danger' : undefined}>
      {value.toLocaleString()}
    </Text>
  )
}

function renderSummaryAverage(value: number | null) {
  if (value === null) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Text strong title="当前页平均值">
      {value}%
    </Text>
  )
}

function renderSummaryProductionStatus(summary: DashboardSummary) {
  const tags = PRODUCTION_STATUS_OPTIONS.filter(
    option => summary.productionStatusCounts[option.value] > 0,
  )

  if (tags.length === 0) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Space size={3} wrap>
      {tags.map(option => (
        <StatusPill
          key={option.value}
          tone={STATUS_TONE[option.value]}
        >
          {option.label} {summary.productionStatusCounts[option.value]}
        </StatusPill>
      ))}
    </Space>
  )
}

function renderSummaryCellContent(
  columnKey: string,
  summary: DashboardSummary,
): ReactNode {
  if (columnKey.startsWith(JOB_COLUMN_KEY_PREFIX)) {
    const jobKey = columnKey.slice(JOB_COLUMN_KEY_PREFIX.length)

    return renderSummaryNumber(summary.jobOutputs[jobKey] ?? 0)
  }

  switch (columnKey) {
    case 'index':
      return (
        <Text strong title="仅统计当前页显示的行">
          汇总
        </Text>
      )
    case 'order_quantity':
      return renderSummaryNumber(summary.orderQuantity)
    case 'extrusionQuantity':
      return renderSummaryNumber(summary.extrusionQuantity)
    case 'precisionCuttingQuantity':
      return renderSummaryNumber(summary.precisionCuttingQuantity)
    case 'reworkRepairStatus':
      return renderReworkRepairStatus(summary.reworkRepairInfo)
    case 'yieldRate':
      return renderSummaryAverage(summary.yieldRate)
    case 'completionRate':
      return renderSummaryAverage(summary.completionRate)
    case 'transferQuantity':
      return renderSummaryNumber(summary.transferQuantity)
    case 'inventoryQuantity':
      return renderSummaryNumber(summary.inventoryQuantity, {
        dangerWhenNegative: true,
      })
    case 'productionStatus':
      return renderSummaryProductionStatus(summary)
    default:
      // 项目号、型号、长度、客户等文本/维度列不汇总
      return null
  }
}

/**
 * 订单现状表格底部固定汇总行（只统计当前页、经列头筛选后的行）。
 * 注意：必须直接返回 <Table.Summary>，rc-table 依赖元素类型判断 fixed，不能再包一层组件。
 */
export function renderOrderStatusSummary({
  columns,
  jobColumns,
  rows,
}: {
  columns: TableColumnsType<OrderStatusDashboardItem>
  jobColumns: readonly OrderStatusJobColumn[]
  rows: readonly OrderStatusDashboardItem[]
}) {
  if (rows.length === 0) {
    return null
  }

  const summary = buildDashboardSummary(
    rows,
    jobColumns.map(column => column.key),
  )

  return (
    <Table.Summary fixed="bottom">
      <Table.Summary.Row>
        {columns.map((column, index) => {
          const columnKey = getColumnKey(column)

          return (
            <Table.Summary.Cell
              key={columnKey}
              index={index}
              align={column.align}
              className={SUMMARY_CELL_CLASS_NAME}
            >
              {renderSummaryCellContent(columnKey, summary)}
            </Table.Summary.Cell>
          )
        })}
      </Table.Summary.Row>
    </Table.Summary>
  )
}
