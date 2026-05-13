import { format } from 'date-fns'
import * as XLSX from 'xlsx-js-style'

import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'

const SHEET_NAME = '优迈成品出库'
const TITLE = '优迈成品出库'

const TABLE_HEADERS = [
  '#',
  '交货日期',
  '采购订单号',
  '行号',
  '物料编码',
  '物料名称',
  '型号',
  '规格',
  '出库数量',
  '重量(KG)',
  '最终库存',
  '计划数量',
  '加工数量',
] as const

const COLUMN_WIDTHS = [4, 12, 26, 6, 18, 16, 10, 10, 10, 12, 12, 10, 10]
const BORDER_COLOR = '000000'
const HEADER_FILL = 'FFFFFF'

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

function buildWorkbook(items: YoumaiFinishedGoodsStockOut[]) {
  const totalWeight = items.reduce((sum, item) => {
    const w = calculateYoumaiWeightKg({
      specification: item.specification,
      specificGravity: item.specific_gravity,
      quantity: item.stock_out_quantity,
    })
    return sum + (w ?? 0)
  }, 0)

  const printDate = format(new Date(), 'yyyy-MM-dd HH:mm')
  const colCount = TABLE_HEADERS.length
  const halfCol = Math.floor(colCount / 2)

  const titleRow = Array.from({ length: colCount }, () => '' as string | number)
  titleRow[0] = TITLE

  const infoRow = Array.from({ length: colCount }, () => '' as string | number)
  infoRow[0] = `重量合计: ${formatNumber(totalWeight)} KG`
  infoRow[halfCol] = `打印日期: ${printDate}`

  const headerRow = [...TABLE_HEADERS] as (string | number)[]

  const bodyRows: (string | number)[][] = items.map((item, index) => {
    const weight = calculateYoumaiWeightKg({
      specification: item.specification,
      specificGravity: item.specific_gravity,
      quantity: item.stock_out_quantity,
    })

    return [
      index + 1,
      formatCellText(item.delivery_date),
      formatCellText(item.purchase_order_no),
      formatCellText(item.purchase_order_line_no),
      formatCellText(item.material_code),
      formatCellText(item.material_name),
      formatCellText(item.model),
      formatCellText(item.specification),
      Number(formatNumber(item.stock_out_quantity)),
      weight === null ? '-' : Number(formatNumber(weight)),
      item.final_stock === null || item.final_stock === undefined
        ? '-'
        : Number(formatNumber(item.final_stock)),
      '',
      '',
    ]
  })

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

  // 标题
  const titleRef = `${colLetter(0)}1`
  if (ws[titleRef]) {
    ws[titleRef].s = {
      font: { name: '宋体', sz: 18, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }

  // 信息行
  const weightRef = `${colLetter(0)}2`
  if (ws[weightRef]) {
    ws[weightRef].s = {
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

  // 表头（第 3 行）
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

  // 数据行
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

  // 数值列保留 3 位
  const numericColumns = [8, 9, 10]
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

export function exportYoumaiFinishedGoodsStockOutToExcel(
  items: YoumaiFinishedGoodsStockOut[],
) {
  const wb = buildWorkbook(items)
  const filename = `优迈成品出库_${items.length}条_${format(
    new Date(),
    'yyyy-MM-dd_HH-mm-ss',
  )}.xlsx`
  XLSX.writeFile(wb, filename, EXCEL_WRITE_OPTIONS)
}
