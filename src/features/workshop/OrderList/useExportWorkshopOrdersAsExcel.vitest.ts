import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import { createWorkshopOrderWorkbookBuffer } from './workshopOrdersExcelDocument'

describe('createWorkshopOrderWorkbookBuffer', () => {
  it('adds a centered title row above QR and sketch headers', () => {
    const workbookBuffer = createWorkshopOrderWorkbookBuffer([])
    const workbook = XLSX.read(workbookBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.A1?.v).toBe('精加工车间生产订单')
    expect(worksheet.A2?.v).toBe('二维码')
    expect(worksheet.B2?.v).toBe('简图')
    expect(worksheet.D2?.v).toBe('结案时间')
    expect(worksheet['!merges']).toEqual(
      expect.arrayContaining([
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 18 },
        },
      ]),
    )
  })

  it('exports closed time in yyyy-mm-dd hh:mm format', () => {
    const workbookBuffer = createWorkshopOrderWorkbookBuffer([
      {
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
      },
    ])
    const workbook = XLSX.read(workbookBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.D3?.v).toBe('2026-06-21 09:10')
  })
})
