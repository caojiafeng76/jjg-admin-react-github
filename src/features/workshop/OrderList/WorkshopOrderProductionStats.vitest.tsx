import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductionItemWithOrderDetail } from '@/services/apiProductionOrders'
import WorkshopOrderProductionStats from './WorkshopOrderProductionStats'
import type { WorkshopOrder } from './types'

const hookState = vi.hoisted(() => ({
  items: [] as unknown[],
  transferStats: undefined as unknown,
}))

vi.mock('./useWorkshopOrderProductionItems', () => ({
  useWorkshopOrderProductionItems: () => ({
    data: hookState.items,
    isLoading: false,
  }),
}))

vi.mock('./useWorkshopOrderTransfers', () => ({
  useWorkshopOrderTransfers: () => ({
    data: hookState.transferStats,
    isLoading: false,
  }),
}))

const ORDER: WorkshopOrder = {
  id: 'o1',
  status: '生产中',
  product_delivery_date: null,
  project_no: 'P001',
  product_model: 'M1',
  length_mm: 1200,
  customer: null,
  customer_model: null,
  order_quantity: 10,
  weight_per_meter_kg: null,
  color_name: null,
  package_name: null,
  product_category: null,
  material_name: null,
  material_code: 'MC1',
}

function makeItem(
  overrides: Partial<ProductionItemWithOrderDetail>,
): ProductionItemWithOrderDetail {
  return {
    id: 'i1',
    operation: '精切切割',
    project_no: 'P001',
    product_model: 'M1',
    length_mm: 1200,
    customer_model: null,
    qualified_quantity: 8,
    incoming_qualified_quantity: 10,
    defect_quantity_1: 2,
    defect_quantity_2: 0,
    defect_reason_1: '加工',
    defect_reason_2: null,
    outsource_defect_quantity: 0,
    outsource_defect_reason: null,
    outsource_unit: null,
    setup_defect_quantity: 0,
    setup_responsible: null,
    standard_seconds: 0,
    remark: null,
    order_id: 'po1',
    order_date: '2026-10-01',
    shift: '白班',
    employee_name: '张三',
    ...overrides,
  }
}

describe('WorkshopOrderProductionStats', () => {
  beforeEach(() => {
    hookState.items = []
    hookState.transferStats = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('未选中订单时提示点击订单行', () => {
    render(<WorkshopOrderProductionStats selectedOrder={null} />)

    expect(screen.getByText('点击上方订单行查看详情')).toBeTruthy()
  })

  it('按工序分组显示合格/不良汇总与合计行', () => {
    hookState.items = [
      makeItem({ id: 'a' }),
      makeItem({ id: 'b', qualified_quantity: 5, defect_quantity_1: 1 }),
    ]

    render(<WorkshopOrderProductionStats selectedOrder={ORDER} />)

    expect(screen.getByText('精切切割')).toBeTruthy()
    // 页签与合计行都显示合格合计 8 + 5
    expect(screen.getAllByText('13')).toHaveLength(2)
    expect(screen.getByText('合计（2 条）')).toBeTruthy()
  })

  it('出库已满且可管理状态时提示结案，点击立即结案回调已结案', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    hookState.transferStats = {
      byWorkshop: [
        { target_workshop: '仓库', total_quantity: 10, record_count: 1 },
      ],
      totalOutbound: 10,
      totalInWarehouse: 10,
      totalTransferred: 10,
    }

    render(
      <WorkshopOrderProductionStats
        selectedOrder={ORDER}
        canManageStatus
        onStatusChange={onStatusChange}
      />,
    )

    expect(screen.getByText('暂无生产工单记录')).toBeTruthy()
    expect(
      screen.getByText('出库进度已达 100%，请尽快修改为已结案'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /立即结案/ }))
    expect(onStatusChange).toHaveBeenCalledWith('已结案')
  })
})
