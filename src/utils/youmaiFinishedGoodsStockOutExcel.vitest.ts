import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { describe, expect, it } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import { parseYoumaiFinishedGoodsStockOutExcel } from './youmaiFinishedGoodsStockOutExcel'
import { buildWorkbook } from './youmaiFinishedGoodsStockOutExport'

function createExcelFile(rows: Array<Array<unknown>>): File {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '采购订单')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], 'youmai-po.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseYoumaiFinishedGoodsStockOutExcel', () => {
  it('parses optional contract_no column and defaults to empty string when absent', async () => {
    const withContract = await parseYoumaiFinishedGoodsStockOutExcel(
      createExcelFile([
        ['采购订单号', '行号', '合同号', '物料编码', '物料名称', '订购数量', '交货日期', '订单备注'],
        ['PO-100', 1, ' HT-001 ', 'XTA-01', '上封头', 8, '2026-11-19', '加急'],
      ]),
    )

    expect(withContract.errors).toEqual([])
    expect(withContract.rows).toEqual([
      {
        purchase_order_no: 'PO-100',
        purchase_order_line_no: '1',
        contract_no: 'HT-001',
        material_code: 'XTA-01',
        material_name: '上封头',
        stock_out_quantity: 8,
        delivery_date: '2026-11-19',
        remarks: '加急',
      },
    ])

    const withoutContract = await parseYoumaiFinishedGoodsStockOutExcel(
      createExcelFile([
        ['采购订单号', '行号', '物料编码', '订购数量', '交货日期'],
        ['PO-101', 2, 'XTA-02', 4, '2026-11-20'],
      ]),
    )

    expect(withoutContract.errors).toEqual([])
    expect(withoutContract.rows[0]?.contract_no).toBe('')
  })
})

describe('buildWorkbook', () => {
  it('includes contract_no column and shifts numeric column formats', () => {
    const item: YoumaiFinishedGoodsStockOut = {
      id: 'row-1',
      product_data_id: 'prod-1',
      material_code: 'XTA-01',
      material_name: '上封头',
      model: '03-02',
      specification: '394',
      specific_gravity: 1.569,
      purchase_order_no: 'PO-100',
      purchase_order_line_no: '1',
      contract_no: 'HT-2026-88',
      delivery_date: '2026-11-19',
      status: '待审核',
      stock_out_quantity: 10,
      final_stock: 25,
      remarks: '',
      created_at: '2026-11-17T00:00:00Z',
      updated_at: '2026-11-17T00:00:00Z',
    }

    const workbook = buildWorkbook([item])
    const sheet = workbook.Sheets['优迈成品出库']
    expect(sheet).toBeDefined()
    expect(sheet?.E3?.v).toBe('合同号')
    expect(sheet?.E4?.v).toBe('HT-2026-88')
    expect(sheet?.J4?.z).toBe('0')
    expect(sheet?.K4?.z).toBe('0.000')
    expect(sheet?.L4?.z).toBe('0')
  })
})
