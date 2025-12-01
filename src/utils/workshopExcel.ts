import * as XLSX from 'xlsx'
import type { WorkSheet } from 'xlsx'

import type { WorkshopOrder } from '@/features/workshop/OrderList'

const TEMPLATE_HEADERS = [
  '产品交货日期(yyyy-mm-dd)',
  '项目号',
  '产品型号',
  '长度(mm)',
  '客户型号',
  '订支数',
  '每米理论重(kg/m)',
  '颜色名称',
  '包装名称',
  '产品类别',
  '材质名称',
  '料号',
]

export function downloadWorkshopOrderTemplate() {
  const wb = XLSX.utils.book_new()
  const wsData = [TEMPLATE_HEADERS]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, '车间订单模板')
  XLSX.writeFile(wb, '车间订单导入模板.xlsx')
}

export interface WorkshopOrderExcelRow {
  '产品交货日期(yyyy-mm-dd)': string
  项目号: string
  产品型号: string
  '长度(mm)': number
  客户型号: string
  订支数: number
  '每米理论重(kg/m)': number
  颜色名称: string
  包装名称: string
  产品类别: string
  材质名称: string
  料号: string
}

export async function parseWorkshopOrderExcel(file: File): Promise<WorkshopOrder[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const templateRows = parseTemplateSheet(sheet)
  if (templateRows.length > 0) {
    const uniqueRows = deduplicateOrders(templateRows)
    validateProjectNoUniqueness(uniqueRows)
    return uniqueRows
  }

  const erpRows = parseErpSalesOrderSheet(sheet)
  if (erpRows.length > 0) {
    const uniqueRows = deduplicateOrders(erpRows)
    validateProjectNoUniqueness(uniqueRows)
    return uniqueRows
  }

  throw new Error('未识别的 Excel 格式，请使用模板或 ERP 导出的《销售订单登记.xlsx》。')
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
      customer_model: row.客户型号 || null,
      order_quantity: row.订支数 ?? null,
      weight_per_meter_kg: row['每米理论重(kg/m)'] ?? null,
      color_name: row.颜色名称 || null,
      package_name: row.包装名称 || null,
      product_category: row.产品类别 || null,
      material_name: row.材质名称 || null,
      material_code: row.料号 || null,
    }))
}

type WorksheetRow = Array<string | number | null | undefined>

interface ErpColumnMap {
  project_no: number[]
  product_model: number[]
  customer_model: number[]
  weight_per_meter_kg: number[]
  length_mm: number[]
  order_quantity: number[]
  product_category: number[]
  color_name: number[]
  package_name: number[]
  material_name: number[]
  material_code: number[]
  product_delivery_date: number[]
}

function parseErpSalesOrderSheet(sheet: WorkSheet): WorkshopOrder[] {
  const rows = XLSX.utils.sheet_to_json<WorksheetRow>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  })

  const mergedRowSkipSet = buildMergedRowSkipSet(sheet)
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1')

  let columnMap = findErpColumnMap(rows)
  if (!columnMap) {
    return []
  }

  const orders: WorkshopOrder[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = range.s.r + i

    if (mergedRowSkipSet.has(rowIndex)) {
      continue
    }

    if (!row || row.length === 0) continue

    if (isErpHeaderRow(row)) {
      columnMap = buildErpColumnMap(row)
      continue
    }

    if (!columnMap || isNoiseRow(row)) continue

    const projectNo = getStringFromRow(row, columnMap.project_no)
    const productModel = getStringFromRow(row, columnMap.product_model)

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
      product_delivery_date: getDateFromRow(row, columnMap.product_delivery_date),
      project_no: projectNo || null,
      product_model: productModel || null,
      length_mm: getNumberFromRow(row, columnMap.length_mm),
      customer_model: getStringFromRow(row, columnMap.customer_model),
      order_quantity: getNumberFromRow(row, columnMap.order_quantity),
      weight_per_meter_kg: getNumberFromRow(row, columnMap.weight_per_meter_kg),
      color_name: getStringFromRow(row, columnMap.color_name),
      package_name: getStringFromRow(row, columnMap.package_name),
      product_category: getStringFromRow(row, columnMap.product_category),
      material_name: getStringFromRow(row, columnMap.material_name),
      material_code: getStringFromRow(row, columnMap.material_code),
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

function buildErpColumnMap(row: WorksheetRow): ErpColumnMap | null {
  const projectNo = findColumnIndices(row, '项目号')
  const productModel = findColumnIndices(row, '产品型号')
  const customerModel = findColumnIndices(row, '客户型号')

  if (!projectNo.length || !productModel.length || !customerModel.length) {
    return null
  }

  return {
    project_no: projectNo,
    product_model: productModel,
    customer_model: customerModel,
    weight_per_meter_kg: findColumnIndices(row, '比重'),
    length_mm: [
      ...findColumnIndices(row, '精切长度'),
      ...findColumnIndices(row, '长度'),
    ],
    order_quantity: findColumnIndices(row, '支数'),
    product_category: findColumnIndices(row, '表面处理'),
    color_name: findColumnIndices(row, '颜色'),
    package_name: findColumnIndices(row, '包装方式'),
    material_name: findColumnIndices(row, '材质'),
    material_code: findColumnIndices(row, '料号'),
    product_delivery_date: findColumnIndices(row, '交货日期'),
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

function getCellValue(row: WorksheetRow, indices: number[]): string | number | null {
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

  const requiredHeaders = ['项目号', '产品型号', '客户型号']
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
    return keywords.some((keyword) => normalized.includes(removeSpaces(keyword)))
  })
}

function removeSpaces(value: string) {
  return value.replace(/\s+/g, '')
}

function buildMergedRowSkipSet(sheet: WorkSheet): Set<number> {
  const skip = new Set<number>()
  const merges = sheet['!merges'] ?? []

  for (const merge of merges) {
    if (!merge || !merge.s || !merge.e) continue
    if (merge.s.r === merge.e.r) continue

    for (let r = merge.s.r + 1; r <= merge.e.r; r++) {
      skip.add(r)
    }
  }

  return skip
}
