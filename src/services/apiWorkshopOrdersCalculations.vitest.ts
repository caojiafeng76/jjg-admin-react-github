import { describe, expect, it } from 'vitest'

import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  assertWorkshopOrderHasMeaningfulContent,
  buildSalesOrderPayload,
  formatBlockedProjectNos,
  normalizeWorkshopOrderInput,
} from './apiWorkshopOrdersCalculations'

const EMPTY_ORDER: WorkshopOrder = {
  product_delivery_date: null,
  project_no: null,
  product_model: null,
  length_mm: null,
  customer: null,
  customer_model: null,
  order_quantity: null,
  weight_per_meter_kg: null,
  color_name: null,
  package_name: null,
  product_category: null,
  material_name: null,
  material_code: null,
}

describe('车间订单计算函数', () => {
  it('规整订单输入：去空格、空串转 null、NaN 转 null', () => {
    expect(
      normalizeWorkshopOrderInput({
        ...EMPTY_ORDER,
        project_no: ' P001 ',
        customer: '  ',
        length_mm: Number.NaN,
        order_quantity: 10,
      }),
    ).toMatchObject({
      project_no: 'P001',
      customer: null,
      length_mm: null,
      order_quantity: 10,
    })
  })

  it('订单没有任何有效内容时抛出带行标签的错误', () => {
    expect(() =>
      assertWorkshopOrderHasMeaningfulContent(EMPTY_ORDER, '第 2 行订单'),
    ).toThrow('第 2 行订单没有任何有效内容')
    expect(() =>
      assertWorkshopOrderHasMeaningfulContent(
        { ...EMPTY_ORDER, length_mm: 1200 },
        '订单',
      ),
    ).not.toThrow()
  })

  it('新建时带默认状态，更新时未传状态不写 status、传了 closed_at 才写', () => {
    expect(
      buildSalesOrderPayload({ ...EMPTY_ORDER, project_no: 'P001' }, 'create'),
    ).toMatchObject({ project_no: 'P001', status: '生产中' })

    const updatePayload = buildSalesOrderPayload(
      { ...EMPTY_ORDER, project_no: 'P001' },
      'update',
    )
    expect(updatePayload).not.toHaveProperty('status')
    expect(updatePayload).not.toHaveProperty('closed_at')

    expect(
      buildSalesOrderPayload(
        { ...EMPTY_ORDER, status: '已结案', closed_at: ' ' },
        'update',
      ),
    ).toMatchObject({ status: '已结案', closed_at: null })
  })

  it('被引用订单的项目号超过 3 个时省略显示', () => {
    expect(formatBlockedProjectNos([], '所选订单')).toBe('所选订单')
    expect(formatBlockedProjectNos(['A', 'B'], '所选订单')).toBe('A、B')
    expect(formatBlockedProjectNos(['A', 'B', 'C', 'D'], '所选订单')).toBe(
      'A、B、C 等4条订单',
    )
  })
})
