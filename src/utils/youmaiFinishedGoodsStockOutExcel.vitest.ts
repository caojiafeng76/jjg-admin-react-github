import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import { parseYoumaiFinishedGoodsStockOutExcel } from './youmaiFinishedGoodsStockOutExcel'
import {
  buildWorkbook,
  buildWorkbookBuffer,
} from './youmaiFinishedGoodsStockOutExport'

function createSampleItem(
  overrides: Partial<YoumaiFinishedGoodsStockOut> = {},
): YoumaiFinishedGoodsStockOut {
  return {
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
    ...overrides,
  }
}

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
    const item = createSampleItem()

    const workbook = buildWorkbook([item])
    const sheet = workbook.Sheets['优迈成品出库']
    expect(sheet).toBeDefined()
    expect(sheet?.E3?.v).toBe('合同号')
    expect(sheet?.E4?.v).toBe('HT-2026-88')
    expect(sheet?.J4?.z).toBe('0')
    expect(sheet?.K4?.z).toBe('0.000')
    expect(sheet?.L4?.z).toBe('0')
  })

  it('configures compact exact column widths, narrow margins, 10pt fonts, and adaptive row height', () => {
    const regularItem = createSampleItem()
    const longCodeItem = createSampleItem({
      id: 'row-2',
      material_code: 'YM-ABCDEFGHIJ-1234567890-XYZ12',
    })

    const workbook = buildWorkbook([regularItem, longCodeItem])
    const sheet = workbook.Sheets['优迈成品出库']

    expect(sheet?.['!margins']).toEqual({
      left: 0.2,
      right: 0.2,
      top: 0.35,
      bottom: 0.35,
      header: 0.15,
      footer: 0.15,
    })

    const cols = sheet?.['!cols'] ?? []
    expect(cols).toHaveLength(14)
    expect(cols.every(col => typeof col.width === 'number' && col.wpx === undefined)).toBe(true)

    const totalColWidth = cols.reduce((sum, col) => sum + (col.width ?? 0), 0)
    expect(totalColWidth).toBeLessThanOrEqual(140)

    expect(sheet?.A3?.s?.font?.sz).toBe(10)
    expect(sheet?.A4?.s?.font?.sz).toBe(10)
    expect(sheet?.['!rows']?.[3]?.hpt).toBe(22)
    expect(sheet?.['!rows']?.[4]?.hpt).toBeGreaterThan(22)
  })
})

describe('buildWorkbookBuffer', () => {
  it('embeds A4 landscape 100% print setup, narrow margins, and exact XML column widths', async () => {
    const buffer = await buildWorkbookBuffer([createSampleItem()])
    const zip = await JSZip.loadAsync(buffer)
    const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string')

    expect(sheetXml).toBeDefined()
    const xml = sheetXml ?? ''

    const colWidths = Array.from(
      xml.matchAll(/<col\s[^>]*width="([\d.]+)"[^>]*\/>/g),
      match => Number(match[1]),
    )
    expect(colWidths).toHaveLength(14)
    expect(colWidths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(137, 2)

    expect(xml).toContain('<printOptions horizontalCentered="1"/>')
    expect(xml).toContain(
      '<pageMargins left="0.2" right="0.2" top="0.35" bottom="0.35" header="0.15" footer="0.15"/>',
    )
    expect(xml).toContain(
      '<pageSetup paperSize="9" scale="100" orientation="landscape"/>',
    )
    expect(xml).not.toContain('fitToPage')

    const mergeEndIndex = xml.indexOf('</mergeCells>')
    const printOptionsIndex = xml.indexOf('<printOptions ')
    const marginsIndex = xml.indexOf('<pageMargins ')
    const setupIndex = xml.indexOf('<pageSetup ')
    const ignoredErrorsIndex = xml.indexOf('<ignoredErrors>')

    expect(mergeEndIndex).toBeGreaterThan(-1)
    expect(printOptionsIndex).toBeGreaterThan(mergeEndIndex)
    expect(marginsIndex).toBeGreaterThan(printOptionsIndex)
    expect(setupIndex).toBeGreaterThan(marginsIndex)
    expect(ignoredErrorsIndex).toBeGreaterThan(setupIndex)
  })
})
