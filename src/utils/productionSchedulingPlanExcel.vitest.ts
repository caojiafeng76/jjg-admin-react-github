import { describe, expect, it } from 'vitest'

import type { ProductionSchedulingOrder } from '@/services/apiProductionScheduling'
import { createProductionScheduledPlanWorkbook } from './productionSchedulingPlanExcel'

function createOrder(
  id: string,
  materialCode: string | null,
): ProductionSchedulingOrder {
  return {
    id,
    customer: `客户${id}`,
    customer_model: null,
    material_code: materialCode,
    material_name: '踏板',
    order_quantity: 1,
    process_requirement: '',
    product_delivery_date: null,
    product_model: '型号A',
    project_no: `P-${id}`,
    responsible_person: null,
    responsible_person_ids: null,
    responsible_person_names: null,
    scheduling_remark: '',
    status: '生产中',
    transfer_latest_date: null,
    transfer_latest_workshop: null,
    transfer_quantity: 0,
    transfer_rate: 0,
  } as ProductionSchedulingOrder
}

describe('createProductionScheduledPlanWorkbook', () => {
  it('splits detail sheets by material code numeric dot prefix', () => {
    const workbook = createProductionScheduledPlanWorkbook([
      createOrder('001', '02.BP-1000'),
      createOrder('002', '01.EB-800'),
      createOrder('003', '02.BP-800'),
      createOrder('004', '03.CNC-1000'),
      createOrder('005', 'AB-OTHER'),
    ])

    expect(workbook.SheetNames).toEqual([
      '基础信息',
      '01.',
      '02.',
      '03.',
      '其他',
      '生产资源配置',
      '审核确认',
    ])
    expect(workbook.Sheets['01.'].G3?.v).toBe('01.EB-800')
    expect(workbook.Sheets['02.'].G3?.v).toBe('02.BP-1000')
    expect(workbook.Sheets['02.'].G4?.v).toBe('02.BP-800')
    expect(workbook.Sheets['03.'].G3?.v).toBe('03.CNC-1000')
    expect(workbook.Sheets['其他'].G3?.v).toBe('AB-OTHER')
  })
})
