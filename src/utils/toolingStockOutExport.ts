import { format } from 'date-fns'
import * as XLSX from 'xlsx-js-style'

import type { ToolingStockOut } from '@/services/apiToolingStockOut'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'

const SHEET_NAME = '刀具出库'
const TITLE = '刀具出库'

const TABLE_HEADERS = [
  '#',
  '出库日期',
  '领用人',
  '用途',
  '机器编号',
  '机器名称',
  '刀具编号',
  '刀具名称',
  '刀具规格',
  '材质',
  '出库数量',
  '最终库存',
  '备注',
] as const

const COLUMN_WIDTHS = [4, 12, 14, 22, 16, 18, 18, 18, 18, 14, 12, 12, 24]
const BORDER_COLOR = '000000'
const HEADER_FILL = 'F2F2F2'

function colLetter(index: number) {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
}

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

function buildWorkbook(items: ToolingStockOut[]) {
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.stock_out_quantity || 0),
    0,
  )
  const printDate = format(new Date(), 'yyyy-MM-dd HH:mm')
  const colCount = TABLE_HEADERS.length
  const halfCol = Math.floor(colCount / 2)

  const titleRow = Array.from({ length: colCount }, () => '' as string | number)
  titleRow[0] = TITLE

  const infoRow = Array.from({ length: colCount }, () => '' as string | number)
  infoRow[0] = `数量合计: ${formatNumber(totalQuantity)}`
  infoRow[halfCol] = `打印日期: ${printDate}`

  const headerRow = [...TABLE_HEADERS] as (string | number)[]

  const bodyRows: (string | number)[][] = items.map((item, index) => [
    index + 1,
    formatCellText(item.stock_out_date),
    formatCellText(item.recipient),
    formatCellText(item.purpose),
    formatCellText(item.machine_no),
    formatCellText(item.machine_name),
    formatCellText(item.tool_code),
    formatCellText(item.tool_name),
    formatCellText(item.tool_spec),
    formatCellText(item.material),
    Number(formatNumber(item.stock_out_quantity)),
    item.final_stock === null || item.final_stock === undefined
      ? '-'
      : Number(formatNumber(item.final_stock)),
    formatCellText(item.remarks),
  ])

  const data = [titleRow, infoRow, headerRow, ...bodyRows]
  const ws = XLSX.utils.aoa_to_sheet(data)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: halfCol - 1 } },
    { s: { r: 1, c: halfCol }, e: { r: 1, c: colCount - 1 } },
  ]

  setColumnWidths(ws, COLUMN_WIDTHS)

  ws['!rows'] = [
    { hpt: 30, hpx: 30 },
    { hpt: 22, hpx: 22 },
    { hpt: 24, hpx: 24 },
    ...bodyRows.map(() => ({ hpt: 22, hpx: 22 })),
  ]

  const titleRef = `${colLetter(0)}1`
  if (ws[titleRef]) {
    ws[titleRef].s = {
      font: { name: '宋体', sz: 18, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }

  const quantityRef = `${colLetter(0)}2`
  if (ws[quantityRef]) {
    ws[quantityRef].s = {
      font: { name: '宋体', sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
  }
  const dateRef = `${colLetter(halfCol)}2`
  if (ws[dateRef]) {
    ws[dateRef].s = {
      font: { name: '宋体', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' },
    }
  }

  for (let c = 0; c < colCount; c += 1) {
    const ref = `${colLetter(c)}3`
    if (!ws[ref]) ws[ref] = { v: '' }
    ws[ref].s = {
      font: { name: '宋体', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: HEADER_FILL } },
      border: {
        top: { style: 'thin', color: { rgb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
        left: { style: 'thin', color: { rgb: BORDER_COLOR } },
        right: { style: 'thin', color: { rgb: BORDER_COLOR } },
      },
    }
  }

  const totalRows = data.length
  for (let r = 3; r < totalRows; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const ref = `${colLetter(c)}${r + 1}`
      if (!ws[ref]) ws[ref] = { v: '' }
      ws[ref].s = {
        font: { name: '宋体', sz: 10.5 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: BORDER_COLOR } },
        },
      }
    }
  }

  const numericColumns = [10, 11]
  for (let r = 3; r < totalRows; r += 1) {
    numericColumns.forEach((c) => {
      const ref = `${colLetter(c)}${r + 1}`
      if (ws[ref] && typeof ws[ref].v === 'number') {
        ws[ref].z = '0.000'
      }
    })
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 3 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME)
  return wb
}

export function exportToolingStockOutToExcel(items: ToolingStockOut[]) {
  const wb = buildWorkbook(items)
  const filename = `刀具出库_${items.length}条_${format(
    new Date(),
    'yyyy-MM-dd_HH-mm-ss',
  )}.xlsx`
  XLSX.writeFile(wb, filename, EXCEL_WRITE_OPTIONS)
}
