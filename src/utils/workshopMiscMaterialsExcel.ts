import type {
  WorkshopMiscMaterialsData,
  WorkshopMiscMaterialsDataFormValues,
} from '@/services/apiWorkshopMiscMaterialsData'
import type {
  WorkshopMiscMaterialsInventory,
  WorkshopMiscMaterialsInventoryImportRow,
} from '@/services/apiWorkshopMiscMaterialsInventory'
import type {
  WorkshopMiscMaterialsMonthlyReportRow,
  WorkshopMiscMaterialsReportStage,
} from '@/services/apiWorkshopMiscMaterialsReport'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'
import {
  formatWorkshopMiscReportMonth,
  sumWorkshopMiscReportRows,
  WORKSHOP_MISC_REPORT_QUANTITY_KEYS,
  WORKSHOP_MISC_REPORT_STAGE_LABELS,
} from '@/features/workshop-misc-materials/MonthlyReport/reportUtils'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

type Cell = string | number | null
type RawRow = Cell[]

export const OTHER_MODEL_PREFIX_GROUP = '其他'
const MAX_SHEET_NAME_LENGTH = 31

export const WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS = [
  '型号',
  '客户型号',
  '规格',
  '类别',
  '备注',
] as const

export const WORKSHOP_MISC_MATERIALS_INVENTORY_TEMPLATE_HEADERS = [
  '型号',
  '客户型号',
  '规格',
  '类别',
  '原材料数量',
  '半成品数量',
  '成品数量',
  '备注',
] as const

export const WORKSHOP_MISC_MATERIALS_REPORT_HEADERS = [
  '#',
  '型号',
  '客户型号',
  '规格',
  '类别',
  '上月结余',
  '本月入库',
  '本月出库',
  '本月调整',
  '月末结存',
] as const

const DATA_TEMPLATE_FILE_NAME = '车间杂项材料资料模板.xlsx'
const INVENTORY_TEMPLATE_FILE_NAME = '车间杂项材料库存模板.xlsx'

export interface ParseExcelResult<T> {
  rows: T[]
  errors: string[]
}

export interface WorkshopMiscModelPrefixGroup<T> {
  group: string
  sheetName: string
  items: T[]
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function formatDateTime(value: string | null | undefined) {
  if (!value)
    return ''
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}

function timestamp() {
  return dayjs().format('YYYY-MM-DD_HH-mm-ss')
}

/**
 * 提取型号开头前缀（取第一个 `-` 含横杠，如 `196-A01` → `196-`）。
 * 自动归一化全角横杠 `－`；不含 `-` 或 `-` 在首字符位置时归入「其他」。
 */
export function extractWorkshopMiscModelPrefix(model: string): string {
  const normalized = model.trim().replaceAll('－', '-')
  const dashIndex = normalized.indexOf('-')
  if (dashIndex <= 0)
    return OTHER_MODEL_PREFIX_GROUP
  return normalized.slice(0, dashIndex + 1)
}

function sanitizeSheetBaseName(name: string): string {
  const cleaned = name
    .replace(/[:\\/?*[\]]/g, '_')
    .replace(/^'+|'+$/g, '')
    .trim()
  return (cleaned || '工作表').slice(0, MAX_SHEET_NAME_LENGTH)
}

function resolveUniqueSheetName(rawName: string, usedLowerNames: Set<string>): string {
  const base = sanitizeSheetBaseName(rawName)
  if (!usedLowerNames.has(base.toLowerCase())) {
    usedLowerNames.add(base.toLowerCase())
    return base
  }

  for (let suffixIndex = 2; ; suffixIndex += 1) {
    const suffix = `(${suffixIndex})`
    const candidate = `${base.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length)}${suffix}`
    if (!usedLowerNames.has(candidate.toLowerCase())) {
      usedLowerNames.add(candidate.toLowerCase())
      return candidate
    }
  }
}

function compareGroupKeys(a: string, b: string): number {
  if (a === b)
    return 0
  if (a === OTHER_MODEL_PREFIX_GROUP)
    return 1
  if (b === OTHER_MODEL_PREFIX_GROUP)
    return -1
  const compared = a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
  if (compared !== 0)
    return compared
  return a < b ? -1 : 1
}

/**
 * 按型号开头把数据拆分为工作表分组：
 * - 自然排序（如 `196-`、`267-`、`1000-`），`其他` 固定排最后；
 * - 清洗 Excel 非法工作表字符并保证 31 字符内大小写不重名。
 */
export function groupWorkshopMiscItemsByModelPrefix<T extends { model: string }>(
  items: T[],
): WorkshopMiscModelPrefixGroup<T>[] {
  const grouped = new Map<string, T[]>()

  for (const item of items) {
    const group = extractWorkshopMiscModelPrefix(item.model)
    const bucket = grouped.get(group)
    if (bucket)
      bucket.push(item)
    else
      grouped.set(group, [item])
  }

  const sortedGroups = Array.from(grouped.keys()).sort(compareGroupKeys)
  const usedLowerNames = new Set<string>()

  return sortedGroups.map(group => ({
    group,
    sheetName: resolveUniqueSheetName(group, usedLowerNames),
    items: grouped.get(group)!,
  }))
}

function downloadTemplate(
  headers: readonly string[],
  sheetName: string,
  fileName: string,
) {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(headers)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName, EXCEL_WRITE_OPTIONS)
}

interface RegisterSheetMergeRange {
  startCol: number
  endCol: number
}

/** 标题行 + 表头 + 数据（+ 可选小计行）的登记表样式工作表 */
function createRegisterSheet(
  title: string,
  headers: readonly string[],
  bodyRows: Cell[][],
  columnWidths: number[],
  subtotalRow?: Cell[],
  subtotalMerges: RegisterSheetMergeRange[] = [],
): XLSX.WorkSheet {
  const columnCount = headers.length
  const titleRow: Cell[] = Array.from({ length: columnCount }, () => '')
  titleRow[0] = title

  const worksheetData: Cell[][] = [titleRow, Array.from(headers), ...bodyRows]
  if (subtotalRow)
    worksheetData.push(subtotalRow)

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
  ]
  const totalRowIndex = worksheetData.length - 1
  if (subtotalRow) {
    for (const range of subtotalMerges) {
      if (range.endCol > range.startCol) {
        merges.push({
          s: { r: totalRowIndex, c: range.startCol },
          e: { r: totalRowIndex, c: range.endCol },
        })
      }
    }
  }
  worksheet['!merges'] = merges

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths,
    freezeYSplit: 2,
  })

  if (subtotalRow) {
    for (let col = 0; col < columnCount; col += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: totalRowIndex, c: col })]
      if (cell)
        cell.s = { ...cell.s, font: { ...cell.s?.font, bold: true } }
    }
  }

  return worksheet
}

async function readRawRows(file: File): Promise<RawRow[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<RawRow>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: true,
  })
}

function validateHeaders(
  headerCells: RawRow = [],
  headers: readonly string[],
  templateFileName: string,
) {
  const headerRow = headerCells.map(cell => normalizeText(cell))
  if (!headers.every((header, index) => headerRow[index] === header)) {
    throw new Error(
      `模板表头不匹配，请使用「${templateFileName}」，表头顺序应为：${headers.join('、')}`,
    )
  }
}

function parseNonNegativeInteger(value: unknown): number | null {
  const text = normalizeText(value)
  if (!text)
    return null
  const quantity = Number(text)
  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : null
}

// ---------------------------------------------------------------
// 材料资料
// ---------------------------------------------------------------

export function downloadWorkshopMiscMaterialsDataTemplate() {
  downloadTemplate(
    WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS,
    '材料资料导入模板',
    DATA_TEMPLATE_FILE_NAME,
  )
}

const DATA_EXPORT_HEADERS = [
  '#',
  '型号',
  '客户型号',
  '规格',
  '类别',
  '备注',
  '更新时间',
] as const

export function createWorkshopMiscMaterialsDataSheet(
  items: WorkshopMiscMaterialsData[],
  groupLabel: string,
) {
  return createRegisterSheet(
    `车间杂项材料资料（${groupLabel}）`,
    DATA_EXPORT_HEADERS,
    items.map((item, index) => [
      index + 1,
      item.model,
      item.customer_model,
      item.specification,
      item.category,
      item.remarks,
      formatDateTime(item.updated_at),
    ]),
    [6, 18, 18, 20, 14, 28, 18],
    ['小计', `共 ${items.length} 条`, '', '', '', '', ''],
    [{ startCol: 1, endCol: DATA_EXPORT_HEADERS.length - 1 }],
  )
}

export function createWorkshopMiscMaterialsDataWorkbook(
  items: WorkshopMiscMaterialsData[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const groups = groupWorkshopMiscItemsByModelPrefix(items)

  if (groups.length === 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsDataSheet([], OTHER_MODEL_PREFIX_GROUP),
      OTHER_MODEL_PREFIX_GROUP,
    )
    return workbook
  }

  for (const { group, sheetName, items: groupItems } of groups) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsDataSheet(groupItems, group),
      sheetName,
    )
  }

  return workbook
}

export function exportWorkshopMiscMaterialsDataToExcel(
  items: WorkshopMiscMaterialsData[],
) {
  const workbook = createWorkshopMiscMaterialsDataWorkbook(items)
  XLSX.writeFile(
    workbook,
    `车间杂项材料资料_${items.length}条_${timestamp()}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}

export async function parseWorkshopMiscMaterialsDataExcel(
  file: File,
): Promise<ParseExcelResult<WorkshopMiscMaterialsDataFormValues>> {
  const rawRows = await readRawRows(file)
  validateHeaders(
    rawRows[0],
    WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS,
    DATA_TEMPLATE_FILE_NAME,
  )

  const rows: WorkshopMiscMaterialsDataFormValues[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const model = normalizeText(cells[0])
    const customerModel = normalizeText(cells[1])
    const specification = normalizeText(cells[2])
    const category = normalizeText(cells[3])
    const remarks = normalizeText(cells[4])

    if (!model && !customerModel && !specification && !category && !remarks)
      return

    if (!model) {
      errors.push(`第 ${rowNumber} 行缺少型号`)
      return
    }

    const key = `${model}\u0000${customerModel}\u0000${specification}\u0000${category}`
    if (seenKeys.has(key)) {
      errors.push(
        `第 ${rowNumber} 行型号“${model}”客户型号“${customerModel}”规格“${specification}”类别“${category}”在 Excel 中重复`,
      )
      return
    }
    seenKeys.add(key)
    rows.push({
      model,
      customer_model: customerModel,
      specification,
      category,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0)
    throw new Error('Excel 中没有可导入的数据')

  return { rows, errors }
}

// ---------------------------------------------------------------
// 材料库存
// ---------------------------------------------------------------

export function downloadWorkshopMiscMaterialsInventoryTemplate() {
  downloadTemplate(
    WORKSHOP_MISC_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
    '材料库存导入模板',
    INVENTORY_TEMPLATE_FILE_NAME,
  )
}

const INVENTORY_EXPORT_HEADERS = [
  '#',
  '型号',
  '客户型号',
  '规格',
  '原材料数量',
  '半成品数量',
  '成品数量',
  '合计',
  '类别',
  '备注',
  '更新时间',
] as const

export function createWorkshopMiscMaterialsInventorySheet(
  items: WorkshopMiscMaterialsInventory[],
  groupLabel: string,
) {
  const sumRaw = items.reduce((sum, item) => sum + item.raw_material_quantity, 0)
  const sumSemi = items.reduce((sum, item) => sum + item.semi_finished_quantity, 0)
  const sumFinished = items.reduce((sum, item) => sum + item.finished_quantity, 0)
  const sumTotal = items.reduce((sum, item) => sum + item.total_quantity, 0)

  return createRegisterSheet(
    `车间杂项材料库存（${groupLabel}）`,
    INVENTORY_EXPORT_HEADERS,
    items.map((item, index) => [
      index + 1,
      item.model,
      item.customer_model,
      item.specification,
      item.raw_material_quantity,
      item.semi_finished_quantity,
      item.finished_quantity,
      item.total_quantity,
      item.category,
      item.remarks,
      formatDateTime(item.updated_at),
    ]),
    [6, 18, 18, 20, 12, 12, 12, 12, 14, 26, 18],
    ['小计', '', '', '', sumRaw, sumSemi, sumFinished, sumTotal, '', '', ''],
    [{ startCol: 0, endCol: 3 }],
  )
}

export function createWorkshopMiscMaterialsInventoryWorkbook(
  items: WorkshopMiscMaterialsInventory[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const groups = groupWorkshopMiscItemsByModelPrefix(items)

  if (groups.length === 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsInventorySheet([], OTHER_MODEL_PREFIX_GROUP),
      OTHER_MODEL_PREFIX_GROUP,
    )
    return workbook
  }

  for (const { group, sheetName, items: groupItems } of groups) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsInventorySheet(groupItems, group),
      sheetName,
    )
  }

  return workbook
}

export function exportWorkshopMiscMaterialsInventoryToExcel(
  items: WorkshopMiscMaterialsInventory[],
) {
  const workbook = createWorkshopMiscMaterialsInventoryWorkbook(items)
  XLSX.writeFile(
    workbook,
    `车间杂项材料库存_${items.length}条_${timestamp()}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}

export async function parseWorkshopMiscMaterialsInventoryExcel(
  file: File,
): Promise<ParseExcelResult<WorkshopMiscMaterialsInventoryImportRow>> {
  const rawRows = await readRawRows(file)
  validateHeaders(
    rawRows[0],
    WORKSHOP_MISC_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
    INVENTORY_TEMPLATE_FILE_NAME,
  )

  const rows: WorkshopMiscMaterialsInventoryImportRow[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const model = normalizeText(cells[0])
    const customerModel = normalizeText(cells[1])
    const specification = normalizeText(cells[2])
    const category = normalizeText(cells[3])
    const rawText = normalizeText(cells[4])
    const semiText = normalizeText(cells[5])
    const finishedText = normalizeText(cells[6])
    const remarks = normalizeText(cells[7])

    if (
      !model
      && !customerModel
      && !specification
      && !category
      && !rawText
      && !semiText
      && !finishedText
      && !remarks
    ) {
      return
    }

    if (!model) {
      errors.push(`第 ${rowNumber} 行缺少型号`)
      return
    }

    if (!rawText && !semiText && !finishedText) {
      errors.push(`第 ${rowNumber} 行请至少填写一项库存数量（清零请填 0）`)
      return
    }

    const rawQty = rawText ? parseNonNegativeInteger(cells[4]) : 0
    if (rawQty === null) {
      errors.push(`第 ${rowNumber} 行原材料数量必须为非负整数`)
      return
    }

    const semiQty = semiText ? parseNonNegativeInteger(cells[5]) : 0
    if (semiQty === null) {
      errors.push(`第 ${rowNumber} 行半成品数量必须为非负整数`)
      return
    }

    const finishedQty = finishedText ? parseNonNegativeInteger(cells[6]) : 0
    if (finishedQty === null) {
      errors.push(`第 ${rowNumber} 行成品数量必须为非负整数`)
      return
    }

    const key = `${model}\u0000${customerModel}\u0000${specification}\u0000${category}`
    if (seenKeys.has(key)) {
      errors.push(
        `第 ${rowNumber} 行型号“${model}”客户型号“${customerModel}”规格“${specification}”类别“${category}”在 Excel 中重复`,
      )
      return
    }
    seenKeys.add(key)
    rows.push({
      model,
      customer_model: customerModel,
      specification,
      category,
      raw_material_quantity: rawQty,
      semi_finished_quantity: semiQty,
      finished_quantity: finishedQty,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0)
    throw new Error('Excel 中没有可导入的数据')

  return { rows, errors }
}

// ---------------------------------------------------------------
// 月度报表
// ---------------------------------------------------------------

/** 小计行合并到「类别」列，后面是 5 个数量列 */
const REPORT_TOTAL_LABEL_COLUMN_COUNT
  = WORKSHOP_MISC_MATERIALS_REPORT_HEADERS.indexOf('类别') + 1

export interface WorkshopMiscMaterialsReportExportOptions {
  month: string
  stage: WorkshopMiscMaterialsReportStage
  category?: string
}

export function createWorkshopMiscMaterialsReportSheet(
  rows: WorkshopMiscMaterialsMonthlyReportRow[],
  {
    month,
    stage,
    category,
    groupLabel,
  }: WorkshopMiscMaterialsReportExportOptions & { groupLabel: string },
) {
  const stageLabel = WORKSHOP_MISC_REPORT_STAGE_LABELS[stage]
  const categoryPart = category ? ` · ${category}` : ''

  return createRegisterSheet(
    `车间杂项材料月度库存报表（${formatWorkshopMiscReportMonth(month)} · ${stageLabel}${categoryPart} · ${groupLabel}）`,
    WORKSHOP_MISC_MATERIALS_REPORT_HEADERS,
    rows.map((row, index) => [
      index + 1,
      row.model,
      row.customer_model,
      row.specification,
      row.category,
      ...WORKSHOP_MISC_REPORT_QUANTITY_KEYS.map(key => row[key]),
    ]),
    [6, 18, 18, 20, 14, 12, 12, 12, 12, 12],
    [
      '小计',
      ...Array.from({ length: REPORT_TOTAL_LABEL_COLUMN_COUNT - 1 }, () => ''),
      ...sumWorkshopMiscReportRows(rows),
    ],
    [{ startCol: 0, endCol: REPORT_TOTAL_LABEL_COLUMN_COUNT - 1 }],
  )
}

export function createWorkshopMiscMaterialsReportWorkbook(
  rows: WorkshopMiscMaterialsMonthlyReportRow[],
  options: WorkshopMiscMaterialsReportExportOptions,
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const groups = groupWorkshopMiscItemsByModelPrefix(rows)

  if (groups.length === 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsReportSheet([], {
        ...options,
        groupLabel: OTHER_MODEL_PREFIX_GROUP,
      }),
      OTHER_MODEL_PREFIX_GROUP,
    )
    return workbook
  }

  for (const { group, sheetName, items: groupRows } of groups) {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorkshopMiscMaterialsReportSheet(groupRows, {
        ...options,
        groupLabel: group,
      }),
      sheetName,
    )
  }

  return workbook
}

export function exportWorkshopMiscMaterialsReportToExcel(
  rows: WorkshopMiscMaterialsMonthlyReportRow[],
  options: WorkshopMiscMaterialsReportExportOptions,
) {
  const stageLabel = WORKSHOP_MISC_REPORT_STAGE_LABELS[options.stage]
  const categoryPart = options.category ? `_${options.category}` : ''
  const workbook = createWorkshopMiscMaterialsReportWorkbook(rows, options)
  XLSX.writeFile(
    workbook,
    `车间杂项材料月度库存报表_${options.month}_${stageLabel}${categoryPart}_${timestamp()}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
