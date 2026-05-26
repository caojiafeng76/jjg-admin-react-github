import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  autoFitColumnWidths,
  setRowHeight,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
} from '@utils/excelStyleUtils'
import { extractFirstWorksheetSketchFiles } from './workshopOrderSketchXlsx'

const TEMPLATE_HEADERS = [
  '产品交货日期(yyyy-mm-dd)',
  '项目号',
  '产品型号',
  '长度(mm)',
  '长度公差',
  '客户',
  '客户型号',
  '订支数',
  '每米理论重(kg/m)',
  '颜色名称',
  '包装名称',
  '产品类别',
  '材质名称',
  '料号',
  '工艺流程',
  '行备注',
]

export function downloadWorkshopOrderTemplate() {
  const wb = XLSX.utils.book_new()
  const wsData = [TEMPLATE_HEADERS]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  // 自动调整列宽
  autoFitColumnWidths(ws, wsData)
  // 设置行高
  setRowHeight(ws, 20, wsData.length)
  // 居中显示
  centerAllCells(ws, wsData)
  XLSX.utils.book_append_sheet(wb, ws, '车间订单模板')
  XLSX.writeFile(wb, '车间订单导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export interface WorkshopOrderExcelRow {
  '产品交货日期(yyyy-mm-dd)': string
  项目号: string
  产品型号: string
  '长度(mm)': number
  长度公差: string
  客户: string
  客户型号: string
  订支数: number
  '每米理论重(kg/m)': number
  颜色名称: string
  包装名称: string
  产品类别: string
  材质名称: string
  料号: string
  工艺流程: string
  行备注: string
}

export async function parseWorkshopOrderExcel(
  file: File,
): Promise<WorkshopOrder[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const sketchesByRowNumber = await extractFirstWorksheetSketchFiles(data)

  const templateRows = parseTemplateSheet(sheet)
  if (templateRows.length > 0) {
    const uniqueRows = deduplicateOrders(templateRows)
    validateProjectNoUniqueness(uniqueRows)
    return uniqueRows
  }

  const erpRows = parseErpSalesOrderSheet(sheet, sketchesByRowNumber)
  if (erpRows.length > 0) {
    const uniqueRows = deduplicateOrders(erpRows)
    validateProjectNoUniqueness(uniqueRows)
    return uniqueRows
  }

  throw new Error(
    '未识别的 Excel 格式，请使用模板或 ERP 导出的《销售订单登记.xlsx》。',
  )
}

function parseTemplateSheet(sheet: WorkSheet): WorkshopOrder[] {
  const rows = XLSX.utils.sheet_to_json<WorkshopOrderExcelRow>(sheet, {
    defval: '',
  })

  return rows
    .filter((row) => !!row.项目号 || !!row.产品型号)
    .map((row) => ({
      product_delivery_date: row['产品交货日期(yyyy-mm-dd)'] || '',
      project_no: row.项目号 || null,
      product_model: row.产品型号 || null,
      length_mm: row['长度(mm)'] ?? null,
      length_tolerance: row.长度公差 || null,
      customer: row.客户 || null,
      customer_model: row.客户型号 || null,
      order_quantity: row.订支数 ?? null,
      weight_per_meter_kg: row['每米理论重(kg/m)'] ?? null,
      color_name: row.颜色名称 || null,
      package_name: row.包装名称 || null,
      product_category: row.产品类别 || null,
      material_name: row.材质名称 || null,
      material_code: row.料号 || null,
      process_flow: row.工艺流程 || null,
      row_remark: row.行备注 || null,
    }))
}

type WorksheetRow = Array<string | number | null | undefined>

interface WorksheetRowEntry {
  rowNumber: number
  row: WorksheetRow
}

interface ErpColumnMap {
  project_no: number[]
  product_model: number[]
  customer_model: number[]
  weight_per_meter_kg: number[]
  length_mm: number[]
  length_tolerance: number[]
  order_quantity: number[]
  product_category: number[]
  color_name: number[]
  package_name: number[]
  material_name: number[]
  material_code: number[]
  process_flow: number[]
  product_delivery_date: number[]
  row_remark: number[]
}

function getWorksheetRowEntries(sheet: WorkSheet): WorksheetRowEntry[] {
  const ref = sheet['!ref']
  if (!ref) return []

  const range = XLSX.utils.decode_range(ref)
  const entries: WorksheetRowEntry[] = []

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: WorksheetRow = []
    let hasValue = false

    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })]
      const value = cell?.v as string | number | null | undefined

      row[colIndex] = value
      if (value !== undefined && value !== null && value !== '') {
        hasValue = true
      }
    }

    if (hasValue) {
      entries.push({ rowNumber: rowIndex + 1, row })
    }
  }

  return entries
}

function parseErpSalesOrderSheet(
  sheet: WorkSheet,
  sketchesByRowNumber = new Map<
    number,
    NonNullable<WorkshopOrder['sketch_file']>
  >(),
): WorkshopOrder[] {
  const rowEntries = getWorksheetRowEntries(sheet)
  const rows = rowEntries.map((entry) => entry.row)

  let columnMap = findErpColumnMap(rows)
  if (!columnMap) {
    return []
  }
  const customer = findErpCustomer(rows)

  const orders: WorkshopOrder[] = []

  for (const entry of rowEntries) {
    const row = entry.row

    if (!row || row.length === 0) continue

    if (isErpHeaderRow(row)) {
      columnMap = buildErpColumnMap(row)
      continue
    }

    if (!columnMap || isNoiseRow(row)) continue

    const projectNo = getStringFromRow(row, columnMap.project_no)
    const productModel = getStringFromRow(row, columnMap.product_model)

    // 如果关键列（项目号或产品型号）有值，即使该行在合并单元格中，也应该解析
    // 因为合并单元格可能只影响某些显示列，而不影响关键数据列
    if (!projectNo && !productModel) continue

    const normalizedProjectNo = projectNo ? removeSpaces(projectNo) : ''
    if (
      normalizedProjectNo === '' ||
      normalizedProjectNo.includes('小计') ||
      normalizedProjectNo.includes('合计') ||
      normalizedProjectNo.includes('客户订单号')
    ) {
      continue
    }

    orders.push({
      product_delivery_date: getDateFromRow(
        row,
        columnMap.product_delivery_date,
      ),
      project_no: projectNo || null,
      product_model: productModel || null,
      length_mm: getNumberFromRow(row, columnMap.length_mm),
      length_tolerance: getStringFromRow(row, columnMap.length_tolerance),
      customer,
      customer_model: getStringFromRow(row, columnMap.customer_model),
      order_quantity: getNumberFromRow(row, columnMap.order_quantity),
      weight_per_meter_kg: getNumberFromRow(row, columnMap.weight_per_meter_kg),
      color_name: getStringFromRow(row, columnMap.color_name),
      package_name: getStringFromRow(row, columnMap.package_name),
      product_category: getStringFromRow(row, columnMap.product_category),
      material_name: getStringFromRow(row, columnMap.material_name),
      material_code: getStringFromRow(row, columnMap.material_code),
      process_flow: getStringFromRow(row, columnMap.process_flow),
      row_remark: getStringFromRow(row, columnMap.row_remark),
      sketch_file: sketchesByRowNumber.get(entry.rowNumber) ?? null,
    })
  }

  return orders
}

function deduplicateOrders(orders: WorkshopOrder[]): WorkshopOrder[] {
  const seen = new Set<string>()
  const unique: WorkshopOrder[] = []

  for (const order of orders) {
    const key = [
      order.project_no ?? '',
      order.product_model ?? '',
      order.customer ?? '',
      order.customer_model ?? '',
      order.material_code ?? '',
      order.product_delivery_date ?? '',
      order.order_quantity ?? '',
    ].join('|')

    if (seen.has(key)) continue
    seen.add(key)
    unique.push(order)
  }

  return unique
}

function validateProjectNoUniqueness(orders: WorkshopOrder[]) {
  const duplicates = orders
    .map((order) => order.project_no?.trim())
    .filter((projectNo): projectNo is string => !!projectNo)
    .reduce<Record<string, number>>((acc, projectNo) => {
      acc[projectNo] = (acc[projectNo] || 0) + 1
      return acc
    }, {})

  const duplicatedProjectNos = Object.entries(duplicates)
    .filter(([, count]) => count > 1)
    .map(([projectNo]) => projectNo)

  if (duplicatedProjectNos.length > 0) {
    throw new Error(
      `Excel 中存在重复项目号：${duplicatedProjectNos.join('、')}。\n请合并或删除重复项目号后重新上传。`,
    )
  }
}

function findErpColumnMap(rows: WorksheetRow[]): ErpColumnMap | null {
  const headerRow = rows.find((row) => row && isErpHeaderRow(row))
  return headerRow ? buildErpColumnMap(headerRow) : null
}

function findErpCustomer(rows: WorksheetRow[]): string | null {
  for (const row of rows) {
    for (const cell of row) {
      if (typeof cell !== 'string') continue

      const normalized = removeSpaces(cell)
      const marker = '购货单位：'

      if (!normalized.includes(marker)) continue

      const value = normalized.split(marker)[1]?.trim()
      if (value) {
        return value
      }
    }
  }

  return null
}

function buildErpColumnMap(row: WorksheetRow): ErpColumnMap | null {
  const projectNo = findColumnIndices(row, '项目号')
  const productModel = findColumnIndices(row, '产品型号')
  const customerModel = findColumnIndices(row, '客户型号')

  if (!projectNo.length || !productModel.length) {
    return null
  }

  return {
    project_no: projectNo,
    product_model: productModel,
    customer_model: customerModel,
    weight_per_meter_kg: findColumnIndices(row, '比重'),
    length_mm: findColumnIndices(row, '长度'),
    length_tolerance: findColumnIndices(row, '长度公差'),
    order_quantity: findColumnIndices(row, '支数'),
    product_category: findColumnIndices(row, '表面处理'),
    color_name: findColumnIndices(row, '颜色'),
    package_name: findColumnIndices(row, '包装方式'),
    material_name: findColumnIndices(row, '材质'),
    material_code: findColumnIndices(row, '料号'),
    process_flow: findColumnIndices(row, '工艺流程'),
    product_delivery_date: findColumnIndices(row, '交货日期'),
    row_remark: findColumnIndices(row, '行备注'),
  }
}

function findColumnIndices(row: WorksheetRow, keyword: string): number[] {
  return row
    .map((cell, index) =>
      typeof cell === 'string' && removeSpaces(cell) === removeSpaces(keyword)
        ? index
        : -1,
    )
    .filter((index) => index !== -1)
}

function getStringFromRow(row: WorksheetRow, indices: number[]): string | null {
  const value = getCellValue(row, indices)
  if (value === null) return null
  return typeof value === 'string' ? value.trim() : String(value)
}

function getNumberFromRow(row: WorksheetRow, indices: number[]): number | null {
  const value = getCellValue(row, indices)
  if (value === null) return null

  const numericValue =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^0-9.-]/g, ''))

  return Number.isFinite(numericValue) ? numericValue : null
}

function getDateFromRow(row: WorksheetRow, indices: number[]): string | null {
  const value = getCellValue(row, indices)
  if (value === null) return null

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return null
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }

  const normalized = value.trim().replace(/[./]/g, '-')
  if (!normalized) return null

  const [datePart] = normalized.split(' ')
  const match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) return datePart

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function getCellValue(
  row: WorksheetRow,
  indices: number[],
): string | number | null {
  for (const index of indices) {
    if (index === undefined || index === null) continue
    const value = row[index]
    if (value === undefined || value === null) continue

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    } else if (typeof value === 'number') {
      if (!Number.isNaN(value)) return value
    }
  }

  return null
}

function isErpHeaderRow(row: WorksheetRow) {
  const normalizedRow = row
    .filter((cell): cell is string => typeof cell === 'string')
    .map((cell) => removeSpaces(cell))

  if (!normalizedRow.length) return false

  const requiredHeaders = ['项目号', '产品型号']
  return requiredHeaders.every((header) => normalizedRow.includes(header))
}

function isNoiseRow(row: WorksheetRow) {
  const keywords = [
    '湖州银都铝业科技有限公司',
    '购货单位',
    '客户订单号',
    '页码',
    '小计',
    '合计',
    '备注',
    '签批',
    '制单',
    '复审',
    '业务员',
  ]
  return row.some((cell) => {
    if (typeof cell !== 'string') return false
    const normalized = removeSpaces(cell)
    return keywords.some((keyword) =>
      normalized.includes(removeSpaces(keyword)),
    )
  })
}

function removeSpaces(value: string) {
  return value.replace(/\s+/g, '')
}
