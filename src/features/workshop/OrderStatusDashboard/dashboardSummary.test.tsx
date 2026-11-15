import type { TableColumnsType } from 'antd'
import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { cleanup, render } from '@testing-library/react'
import { Table } from 'antd'

import { afterEach, describe, expect, it } from 'vitest'
import { renderOrderStatusSummary } from './dashboardSummary'

afterEach(cleanup)

const columns: TableColumnsType<OrderStatusDashboardItem> = [
  { key: 'index', title: '序号', width: 46 },
  { key: 'project_no', dataIndex: 'project_no', title: '项目号', width: 120 },
  { key: 'order_quantity', dataIndex: 'order_quantity', title: '订单数量', width: 80 },
  { key: 'job-切割', title: '切割', width: 72 },
  { key: 'inventoryQuantity', dataIndex: 'inventoryQuantity', title: '库存', width: 80 },
  { key: 'productionStatus', dataIndex: 'productionStatus', title: '生产状态', width: 120 },
]

const rows = [
  {
    id: 'a',
    project_no: 'P-1',
    order_quantity: 1200,
    jobOutputs: { 切割: 60 },
    inventoryQuantity: -6,
    productionStatus: '延期',
  },
  {
    id: 'b',
    project_no: 'P-2',
    order_quantity: 93,
    jobOutputs: { 切割: 95 },
    inventoryQuantity: 2,
    productionStatus: '延期',
  },
] as unknown as OrderStatusDashboardItem[]

function renderTable(dataSource: OrderStatusDashboardItem[]) {
  return render(
    <Table<OrderStatusDashboardItem>
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      scroll={{ y: 200 }}
      summary={pageData =>
        renderOrderStatusSummary({
          columns,
          jobColumns: [{ key: '切割', title: '切割', operations: [] }],
          rows: pageData,
        })}
    />,
  )
}

describe('renderOrderStatusSummary', () => {
  it('renders a summary row pinned below the table body', () => {
    const { container } = renderTable(rows)
    const summaryRow = container.querySelector('.ant-table-summary tr')

    expect(summaryRow).not.toBeNull()
    expect(container.querySelector('.ant-table-header .ant-table-summary')).toBeNull()
    expect(
      container
        .querySelector('.ant-table-body')!
        .compareDocumentPosition(summaryRow!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    const cells = Array.from(summaryRow!.querySelectorAll('td')).map(
      cell => cell.textContent,
    )

    expect(cells).toEqual(['汇总', '', '1,293', '155', '-4', '延期 2'])
  })

  it('renders nothing when there are no rows', () => {
    const { container } = renderTable([])

    expect(container.querySelector('.ant-table-summary')).toBeNull()
  })
})
