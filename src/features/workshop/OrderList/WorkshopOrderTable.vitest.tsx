import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WorkshopOrderTable from './WorkshopOrderTable'
import type { WorkshopOrder } from './index'

vi.mock('./WorkshopOrderQrCell', () => ({
  default: () => <span data-testid="workshop-order-qr-cell" />,
}))

afterEach(() => {
  cleanup()
})

describe('WorkshopOrderTable', () => {
  it('shows the closed time for closed orders', () => {
    const order = {
      id: 'order-1',
      status: '已结案',
      closed_at: '2026-06-21T09:10:11',
      product_delivery_date: '2026-06-30',
      process_flow: '切割',
      customer: '测试客户',
      project_no: 'P-001',
      product_model: 'M-01',
      customer_model: 'C-01',
      weight_per_meter_kg: 1.2,
      length_mm: 1200,
      length_tolerance: '±0.2',
      order_quantity: 10,
      product_category: '氧化',
      color_name: '银色',
      package_name: '纸箱',
      material_name: '铝材',
      material_code: 'AL-01',
      row_remark: null,
    } as WorkshopOrder

    render(
      <WorkshopOrderTable
        loading={false}
        data={[order]}
        projectNoOptions={[]}
        modelOptions={[]}
        projectNoFilterValues={[]}
        modelFilterValues={[]}
        selectedRowKeys={[]}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getAllByText('结案时间').length).toBeGreaterThan(0)
    expect(screen.getByText('2026-06-21 09:10')).toBeInTheDocument()
  })
})
