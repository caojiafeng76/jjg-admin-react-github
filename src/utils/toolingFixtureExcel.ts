import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import type { ToolingFixtureFormValues } from '@/services/apiToolingFixture'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = [
  '工装模具编号',
  '类别',
  '适用产品图号',
  '产品名称',
  '适用设备',
  '存放位置',
  '制作日期',
  '制作厂商',
  '上次保养日期',
  '保养周期（天）',
  '责任人',
  '备注',
] as const

type FixtureExcelField =
  | 'fixture_no'
  | 'category'
  | 'applicable_product_drawing_no'
  | 'product_name'
  | 'applicable_equipment'
  | 'storage_location'
  | 'manufactured_date'
  | 'manufacturer'
  | 'last_maintenance_date'
  | 'maintenance_cycle_days'
  | 'responsible_person'
  | 'remarks'

type RawFixtureRow = Record<FixtureExcelField, unknown>

export interface ParseToolingFixtureExcelResult {
  rows: ToolingFixtureFormValues[]
  errors: string[]
}

export function downloadToolingFixtureTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '工装模具导入模板')
  XLSX.writeFile(workbook, '工装模具导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export async function parseToolingFixtureExcel(
  file: File,
): Promise<ParseToolingFixtureExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const matrix = XLSX.utils.sheet_to_json<Array<unknown>>(sheet, {
    header: 1,
    raw: true,
    defval: '',
  })

  const headerRowIndex = findHeaderRowIndex(matrix)

  if (headerRowIndex < 0) {
    throw new Error(
      `未找到表头行，请使用“工装模具导入模板.xlsx”，表头应包含：${TEMPLATE_HEADERS.join('、')}`,
    )
  }

  const columnMap = buildColumnMap(matrix[headerRowIndex])
  const rows: ToolingFixtureFormValues[] = []
  const errors: string[] = []
  const seenFixtureNos = new Set<string>()

  for (let index = headerRowIndex + 1; index < matrix.length; index += 1) {
    const rowNumber = index + 1
    const raw = readRow(matrix[index], columnMap)

    if (isEmptyRow(raw)) {
      continue
    }

    const fixtureNo = normalizeText(raw.fixture_no)

    if (!fixtureNo) {
      errors.push(`第 ${rowNumber} 行缺少工装模具编号`)
      continue
    }

    if (seenFixtureNos.has(fixtureNo)) {
      errors.push(`第 ${rowNumber} 行工装模具编号“${fixtureNo}”在 Excel 中重复`)
      continue
    }

    seenFixtureNos.add(fixtureNo)

    const manufacturedDate = parseMonthDate(raw.manufactured_date)

    if (hasContent(raw.manufactured_date) && !manufacturedDate) {
      errors.push(`第 ${rowNumber} 行制作日期格式无效，已置空`)
    }

    const lastMaintenanceDate = parseMonthDate(raw.last_maintenance_date)

    if (hasContent(raw.last_maintenance_date) && !lastMaintenanceDate) {
      errors.push(`第 ${rowNumber} 行上次保养日期格式无效，已置空`)
    }

    const maintenanceCycleDays = parseCycleDays(raw.maintenance_cycle_days)

    if (hasContent(raw.maintenance_cycle_days) && maintenanceCycleDays === null) {
      errors.push(`第 ${rowNumber} 行保养周期格式无效，已置空`)
    }

    rows.push({
      fixture_no: fixtureNo,
      category: normalizeText(raw.category),
      applicable_product_drawing_no: normalizeText(
        raw.applicable_product_drawing_no,
      ),
      product_name: normalizeText(raw.product_name),
      applicable_equipment: normalizeText(raw.applicable_equipment),
      storage_location: normalizeText(raw.storage_location),
      manufactured_date: manufacturedDate,
      manufacturer: normalizeText(raw.manufacturer),
      lifecycle: '正常',
      last_maintenance_date: lastMaintenanceDate,
      maintenance_cycle_days: maintenanceCycleDays,
      responsible_person: normalizeText(raw.responsible_person),
      remarks: normalizeText(raw.remarks),
    })
  }

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的数据')
  }

  return { rows, errors }
}

function findHeaderRowIndex(matrix: Array<Array<unknown>>): number {
  const keyHeaders = [
    '类别',
    '适用产品图号',
    '产品名称',
    '适用设备',
    '存放位置',
    '制作厂商',
    '责任人',
  ]

  let headerRowIndex = -1

  matrix.forEach((row, index) => {
    const headers = (row ?? []).map((cell) => normalizeText(cell))

    if (
      headers.includes('工装模具编号') &&
      keyHeaders.some((header) => headers.includes(header))
    ) {
      headerRowIndex = index
    }
  })

  return headerRowIndex
}

function buildColumnMap(headerRow: Array<unknown>): Map<string, number> {
  const columnMap = new Map<string, number>()

  headerRow.forEach((cell, index) => {
    const header = normalizeText(cell)

    if (header) {
      columnMap.set(header, index)
    }
  })

  return columnMap
}

function readRow(
  row: Array<unknown>,
  columnMap: Map<string, number>,
): RawFixtureRow {
  const getValue = (header: string) => {
    const columnIndex = columnMap.get(header)

    return columnIndex === undefined ? '' : row[columnIndex] ?? ''
  }

  const cycleHeader = columnMap.has('保养周期（天）')
    ? '保养周期（天）'
    : '保养周期'

  return {
    fixture_no: getValue('工装模具编号'),
    category: getValue('类别'),
    applicable_product_drawing_no: getValue('适用产品图号'),
    product_name: getValue('产品名称'),
    applicable_equipment: getValue('适用设备'),
    storage_location: getValue('存放位置'),
    manufactured_date: getValue('制作日期'),
    manufacturer: getValue('制作厂商'),
    last_maintenance_date: getValue('上次保养日期'),
    maintenance_cycle_days: getValue(cycleHeader),
    responsible_person: getValue('责任人'),
    remarks: getValue('备注'),
  }
}

function isEmptyRow(row: RawFixtureRow): boolean {
  return Object.values(row).every((value) => !hasContent(value))
}

function hasContent(value: unknown): boolean {
  return normalizeText(value) !== ''
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function parseMonthDate(value: unknown): string | null {
  const text = normalizeText(value)

  if (!text) {
    return null
  }

  if (typeof value === 'number' && value >= 40000 && value <= 60000) {
    const serialDate = dayjsFromExcelSerial(value)

    if (serialDate) {
      return serialDate
    }
  }

  const parts = text.split(/[./\-年]/).filter(Boolean)
  const year = Number(parts[0])
  const month = parts.length > 1 ? Number(parts[1]) : 1

  if (
    !Number.isInteger(year) ||
    year < 1970 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  if (parts.length >= 3) {
    const fullDate = dayjs(text)

    if (fullDate.isValid()) {
      return fullDate.format('YYYY-MM-DD')
    }
  }

  return `${year}-${String(month).padStart(2, '0')}-01`
}

function dayjsFromExcelSerial(value: number): string | null {
  const date = new Date(Math.round((value - 25569) * 86400 * 1000))

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function parseCycleDays(value: unknown): number | null {
  const text = normalizeText(value)

  if (!text) {
    return null
  }

  const match = text.match(/\d+/)

  if (!match) {
    return null
  }

  const parsed = Number(match[0])

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
