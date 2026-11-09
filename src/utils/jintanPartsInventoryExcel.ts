import type {
  JintanPartsInventory,
  JintanPartsInventoryImportRow,
} from '@/services/apiJintanPartsInventory'
import dayjs from 'dayjs'

import * as XLSX from 'xlsx-js-style'
import { JINTAN_PARTS_STOCK_STATUS_CONFIG } from '@/features/jintan/PartsInventory/stockStatus'
import {
  DEFAULT_JINTAN_ITEM_TYPE,
  parseJintanItemType,
} from '@/services/jintanItemType'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = ['名称', '规格', '库存数量', '备注', '类型', '颜色'] as const
const ITEM_TYPE_COLUMN_INDEX = TEMPLATE_HEADERS.indexOf('类型')
const COLOR_COLUMN_INDEX = TEMPLATE_HEADERS.indexOf('颜色')
const OPTIONAL_COLUMN_INDEXES: readonly number[] = [ITEM_TYPE_COLUMN_INDEX, COLOR_COLUMN_INDEX]

const TEMPLATE_FILE_NAME = '金檀木业配件库存模板.xlsx'
const TEMPLATE_SHEET_NAME = '配件库存导入模板'

const EXPORT_SHEET_NAME = '配件库存'
const EXPORT_TITLE = '金檀木业配件库存'
const EXPORT_HEADERS = [
  '#',
  '类型',
  '名称',
  '规格',
  '颜色',
  '材质',
  '采购厂家',
  '库存数量',
  '单台数量',
  '安全库存',
  '阈值',
  '状态',
  '备注',
  '更新时间',
] as const
const EXPORT_COLUMN_WIDTHS = [6, 6, 20, 18, 10, 14, 18, 12, 10, 10, 10, 10, 28, 20]
const EXPORT_QUANTITY_COLUMN_INDEX = EXPORT_HEADERS.indexOf('库存数量')
const EXPORT_STATUS_COLUMN_INDEX = EXPORT_HEADERS.indexOf('状态')
const EXPORT_BODY_START_ROW = 2

export interface ParseJintanPartsInventoryExcelResult {
  rows: JintanPartsInventoryImportRow[]
  errors: string[]
}

export function downloadJintanPartsInventoryTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATE_SHEET_NAME)
  XLSX.writeFile(workbook, TEMPLATE_FILE_NAME, EXCEL_WRITE_OPTIONS)
}

export function createJintanPartsInventoryExportWorkbook(
  items: JintanPartsInventory[],
): XLSX.WorkBook {
  const columnCount = EXPORT_HEADERS.length
  const titleRow = Array.from({ length: columnCount }, () => '')
  titleRow[0] = EXPORT_TITLE

  const bodyRows = items.map((item, index) => [
    index + 1,
    item.item_type,
    item.part_name,
    item.specification,
    item.color,
    item.material,
    item.supplier,
    item.quantity,
    item.unit_quantity ?? '',
    item.safety_stock ?? '',
    item.threshold_stock ?? '',
    JINTAN_PARTS_STOCK_STATUS_CONFIG[item.stock_status]?.label ?? '',
    item.remarks,
    formatDateTime(item.updated_at),
  ])

  const worksheetData = [titleRow, Array.from(EXPORT_HEADERS), ...bodyRows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
  ]

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths: EXPORT_COLUMN_WIDTHS,
    freezeYSplit: 2,
  })
  applyStockStatusFills(worksheet, items)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME)
  return workbook
}

export function exportJintanPartsInventoryToExcel(
  items: JintanPartsInventory[],
) {
  const workbook = createJintanPartsInventoryExportWorkbook(items)
  const filename = `金檀木业配件库存_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}

export async function parseJintanPartsInventoryExcel(
  file: File,
): Promise<ParseJintanPartsInventoryExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rawRows = XLSX.utils.sheet_to_json<Array<string | number | null>>(
    sheet,
    {
      header: 1,
      raw: true,
      defval: '',
      blankrows: true,
    },
  )

  validateTemplateHeaders(rawRows[0])
  const hasItemTypeColumn = Boolean(
    normalizeText(rawRows[0]?.[ITEM_TYPE_COLUMN_INDEX]),
  )
  const hasColorColumn = Boolean(
    normalizeText(rawRows[0]?.[COLOR_COLUMN_INDEX]),
  )

  const rows: JintanPartsInventoryImportRow[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const partName = normalizeText(cells[0])
    const specification = normalizeText(cells[1])
    const quantityText = normalizeText(cells[2])
    const remarks = normalizeText(cells[3])

    const isEmptyRow = !partName && !specification && !quantityText && !remarks

    if (isEmptyRow) {
      return
    }

    if (!partName) {
      errors.push(`第 ${rowNumber} 行缺少名称`)
      return
    }

    const quantity = parseQuantity(cells[2])
    if (quantity === null) {
      errors.push(`第 ${rowNumber} 行库存数量必须为非负整数`)
      return
    }

    const itemTypeText = hasItemTypeColumn
      ? normalizeText(cells[ITEM_TYPE_COLUMN_INDEX])
      : ''
    const itemType = itemTypeText
      ? parseJintanItemType(itemTypeText)
      : DEFAULT_JINTAN_ITEM_TYPE
    if (!itemType) {
      errors.push(`第 ${rowNumber} 行类型只能填 A 或 B`)
      return
    }

    const color = hasColorColumn
      ? normalizeText(cells[COLOR_COLUMN_INDEX])
      : ''

    const dedupeKey = `${itemType}\u0000${partName}\u0000${specification}\u0000${color}`
    if (seenKeys.has(dedupeKey)) {
      errors.push(
        `第 ${rowNumber} 行类型“${itemType}”名称“${partName}”规格“${specification}”${color ? `颜色“${color}”` : ''}在 Excel 中重复`,
      )
      return
    }

    seenKeys.add(dedupeKey)
    rows.push({
      item_type: itemType,
      part_name: partName,
      specification,
      color,
      quantity,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的数据')
  }

  return { rows, errors }
}

function applyStockStatusFills(
  worksheet: XLSX.WorkSheet,
  items: JintanPartsInventory[],
) {
  items.forEach((item, index) => {
    const config = JINTAN_PARTS_STOCK_STATUS_CONFIG[item.stock_status]
    if (!config?.excelFill) {
      return
    }

    const row = EXPORT_BODY_START_ROW + index
    for (const col of [
      EXPORT_QUANTITY_COLUMN_INDEX,
      EXPORT_STATUS_COLUMN_INDEX,
    ]) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]
      if (!cell)
        continue
      cell.s = {
        ...cell.s,
        font: { ...cell.s?.font, color: { rgb: config.excelFont } },
        fill: { patternType: 'solid', fgColor: { rgb: config.excelFill } },
      }
    }
  })
}

function validateTemplateHeaders(
  headerCells: Array<string | number | null> = [],
) {
  const headerRow = headerCells.map(cell => normalizeText(cell))
  const templateHeaders = Array.from(TEMPLATE_HEADERS)

  // 类型、颜色列选填：旧模板没有这两列也能导入，有内容时表头必须是「类型」「颜色」
  const matches = templateHeaders.every(
    (header, index) =>
      headerRow[index] === header
      || (OPTIONAL_COLUMN_INDEXES.includes(index) && !headerRow[index]),
  )

  if (!matches) {
    throw new Error(
      `模板表头不匹配，请使用「${TEMPLATE_FILE_NAME}」，表头顺序应为：${templateHeaders.join('、')}`,
    )
  }
}

function parseQuantity(value: unknown): number | null {
  const text = normalizeText(value)
  if (!text) {
    return null
  }

  const quantity = Number(text)
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}
