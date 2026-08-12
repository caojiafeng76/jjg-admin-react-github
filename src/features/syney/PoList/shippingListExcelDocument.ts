import { utils, writeFile } from 'xlsx-js-style'
import dayjs from 'dayjs'

import {
  autoFitColumnWidths,
  setRowHeight,
  EXCEL_WRITE_OPTIONS,
} from '@utils/excelStyleUtils'

const HEADER_ROW_HEIGHT = 28
const BODY_ROW_HEIGHT = 22

const EXCEL_HEADERS = [
  '序号',
  '采购单号',
  '生产编号',
  '送货单号',
  '商标',
  '规格',
  '工艺',
  '备注',
] as const

export interface ShippingListRow {
  No: string
  SONo: string
  Brand: string
  Spec: string
  Technique: string
  Remark: string
}

const BORDER = {
  top: { style: 'thin' as const, color: { rgb: '000000' } },
  bottom: { style: 'thin' as const, color: { rgb: '000000' } },
  left: { style: 'thin' as const, color: { rgb: '000000' } },
  right: { style: 'thin' as const, color: { rgb: '000000' } },
}

function applyTitleStyle(
  ws: ReturnType<typeof utils.aoa_to_sheet>,
  colCount: number,
) {
  for (let col = 0; col < colCount; col++) {
    const cellRef = `${String.fromCharCode(65 + col)}1`
    if (!ws[cellRef]) ws[cellRef] = { v: '' }
    ws[cellRef].s = {
      ...(ws[cellRef].s || {}),
      font: { name: '宋体', sz: 14, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
  ]
}

function applyHeaderStyle(
  ws: ReturnType<typeof utils.aoa_to_sheet>,
  colCount: number,
) {
  for (let col = 0; col < colCount; col++) {
    const cellRef = `${String.fromCharCode(65 + col)}2`
    if (!ws[cellRef]) ws[cellRef] = { v: '' }
    ws[cellRef].s = {
      ...(ws[cellRef].s || {}),
      font: { name: '宋体', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: 'D8E4F1' } },
      border: BORDER,
    }
  }
}

function applyBodyStyle(
  ws: ReturnType<typeof utils.aoa_to_sheet>,
  rowCount: number,
  colCount: number,
) {
  for (let row = 2; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`
      if (!ws[cellRef]) ws[cellRef] = { v: '' }
      ws[cellRef].s = {
        ...(ws[cellRef].s || {}),
        font: { name: '宋体', sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: BORDER,
      }
    }
  }
}

/**
 * 导出发货清单 Excel。
 * 送货单号列留空，由用户导出后自行填写。
 */
export function exportShippingListAsExcel(
  orders: ShippingListRow[],
  date = new Date(),
) {
  if (!orders || orders.length === 0) return false

  const wb = utils.book_new()
  const rows: (string | number)[][] = []

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const row: (string | number)[] = [
      i + 1,
      order.No ?? '',
      order.SONo ?? '',
      '', // 送货单号：留空，由用户填写
      order.Brand ?? '',
      order.Spec ?? '',
      order.Technique ?? '',
      order.Remark ?? '',
    ]
    rows.push(row)
  }

  const data: (string | number)[][] = [
    [`${dayjs(date).format('M.D')}发货清单`],
    Array.from(EXCEL_HEADERS),
    ...rows,
  ]
  const ws = utils.aoa_to_sheet(data)

  autoFitColumnWidths(ws, data, 8, 60)
  setRowHeight(ws, 30, 1)
  setRowHeight(ws, HEADER_ROW_HEIGHT, 1)
  setRowHeight(ws, BODY_ROW_HEIGHT, rows.length)

  applyTitleStyle(ws, EXCEL_HEADERS.length)
  applyHeaderStyle(ws, EXCEL_HEADERS.length)
  applyBodyStyle(ws, rows.length + 2, EXCEL_HEADERS.length)

  ws['!freeze'] = { xSplit: 0, ySplit: 2 }

  utils.book_append_sheet(wb, ws, '发货清单')
  writeFile(
    wb,
    `发货清单-${dayjs(date).format('YYYY-MM-DD')}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
  return true
}
