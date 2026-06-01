import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import type { LaborProtectionRequisition } from '@/services/apiLaborProtectionRequisitions'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'

const DETAIL_SHEET_NAME = '领料明细'
const SUMMARY_SHEET_NAME = '按种类汇总'
const SAW_BLADE_SUMMARY_SHEET_NAME = '锯片汇总'
const DETAIL_TITLE = '劳保领料明细'
const SUMMARY_TITLE = '劳保领料按种类汇总'
const SAW_BLADE_SUMMARY_TITLE = '劳保领料锯片汇总'

const DETAIL_HEADERS = [
  '#',
  '种类',
  '岗位',
  '机器编号',
  '机器名称',
  '数量',
  '领取人',
  '领用方式',
  '更新时间',
] as const

const SUMMARY_HEADERS = ['#', '种类', '数量合计', '领料笔数'] as const

const DETAIL_COLUMN_WIDTHS = [6, 24, 18, 16, 18, 12, 16, 12, 22]
const SUMMARY_COLUMN_WIDTHS = [6, 28, 14, 14]

const BORDER_COLOR = '000000'
const HEADER_FILL = 'D8E4F1'
const TOTAL_FILL = 'FFF2CC'
const SAW_BLADE_SUMMARY_CATEGORY_KEYWORDS = ['锯片', '切割油', '切削液'] as const

function colLetter(index: number) {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function isSawBladeCategory(category: string | null | undefined) {
  return Boolean(
    category &&
      SAW_BLADE_SUMMARY_CATEGORY_KEYWORDS.some((keyword) =>
        category.includes(keyword),
      ),
  )
}

interface CategorySummary {
  category: string
  quantity: number
  count: number
}

function summarizeByCategory(
  items: LaborProtectionRequisition[],
): CategorySummary[] {
  const map = new Map<string, CategorySummary>()
  items.forEach((item) => {
    const key = item.category || '(未分类)'
    const existing = map.get(key)
    if (existing) {
      existing.quantity += Number(item.quantity || 0)
      existing.count += 1
    } else {
      map.set(key, {
        category: key,
        quantity: Number(item.quantity || 0),
        count: 1,
      })
    }
  })
  return Array.from(map.values()).sort((a, b) =>
    a.category.localeCompare(b.category, 'zh-CN'),
  )
}

interface FilterInfo {
  keyword?: string
  categoryName?: string
  updatedStartDate?: string
  updatedEndDate?: string
}

function buildFilterText(filters: FilterInfo) {
  const parts: string[] = []
  if (filters.keyword) parts.push(`关键字: ${filters.keyword}`)
  if (filters.categoryName) parts.push(`种类: ${filters.categoryName}`)
  if (filters.updatedStartDate || filters.updatedEndDate) {
    parts.push(
      `更新时间: ${filters.updatedStartDate || '不限'} ~ ${
        filters.updatedEndDate || '不限'
      }`,
    )
  }
  return parts.length > 0 ? parts.join('  |  ') : '筛选条件: 全部'
}

function setBorderedCenterStyle(
  ws: XLSX.WorkSheet,
  ref: string,
  options: {
    bold?: boolean
    sz?: number
    fill?: string
    align?: 'left' | 'center' | 'right'
    numFmt?: string
  } = {},
) {
  const { bold = false, sz = 10.5, fill, align = 'center', numFmt } = options
  if (!ws[ref]) ws[ref] = { v: '' }
  ws[ref].s = {
    font: { name: '宋体', sz, bold },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
    ...(fill ? { fill: { fgColor: { rgb: fill } } } : {}),
    border: {
      top: { style: 'thin', color: { rgb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
      left: { style: 'thin', color: { rgb: BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: BORDER_COLOR } },
    },
  }
  if (numFmt) ws[ref].z = numFmt
}

function buildHeaderRows(
  colCount: number,
  title: string,
  filterText: string,
  exportTime: string,
): { data: (string | number)[][]; merges: XLSX.Range[] } {
  const data: (string | number)[][] = []
  const merges: XLSX.Range[] = []

  const titleRow: (string | number)[] = Array.from(
    { length: colCount },
    () => '',
  )
  titleRow[0] = title
  data.push(titleRow)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } })

  const infoRow: (string | number)[] = Array.from(
    { length: colCount },
    () => '',
  )
  infoRow[0] = filterText
  infoRow[colCount - 1] = `导出时间: ${exportTime}`
  data.push(infoRow)
  if (colCount > 1) {
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 2 } })
  }

  return { data, merges }
}

function applyHeaderStyles(ws: XLSX.WorkSheet, colCount: number) {
  if (ws['A1']) {
    ws['A1'].s = {
      font: { name: '宋体', sz: 16, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }
  setBorderedCenterStyle(ws, 'A2', { sz: 11, align: 'left' })
  setBorderedCenterStyle(ws, `${colLetter(colCount - 1)}2`, {
    sz: 11,
    align: 'right',
  })
}

function buildDetailSheet(
  items: LaborProtectionRequisition[],
  filterText: string,
  exportTime: string,
) {
  const colCount = DETAIL_HEADERS.length
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  )

  const { data, merges } = buildHeaderRows(
    colCount,
    `${DETAIL_TITLE}（共 ${items.length} 条）`,
    filterText,
    exportTime,
  )

  data.push([...DETAIL_HEADERS])
  const headerRowIdx = data.length - 1

  const startIdx = data.length
  items.forEach((item, index) => {
    data.push([
      index + 1,
      formatCellText(item.category),
      formatCellText(item.job_title),
      formatCellText(item.machine_no),
      formatCellText(item.machine_name),
      Number(item.quantity || 0),
      formatCellText(item.recipient),
      formatCellText(item.collection_method),
      formatDateTime(item.updated_at),
    ])
  })
  const endIdx = data.length - 1

  const totalRow: (string | number)[] = Array.from(
    { length: colCount },
    () => '',
  )
  totalRow[0] = '合计'
  totalRow[5] = totalQuantity
  data.push(totalRow)
  const totalRowIdx = data.length - 1
  merges.push({
    s: { r: totalRowIdx, c: 0 },
    e: { r: totalRowIdx, c: 4 },
  })
  merges.push({
    s: { r: totalRowIdx, c: 7 },
    e: { r: totalRowIdx, c: colCount - 1 },
  })

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merges
  setColumnWidths(ws, DETAIL_COLUMN_WIDTHS)

  const rows: { hpt?: number; hpx?: number }[] = []
  rows[0] = { hpt: 30, hpx: 30 }
  for (let i = 1; i < data.length; i += 1) {
    rows[i] = { hpt: 22, hpx: 22 }
  }
  ws['!rows'] = rows

  applyHeaderStyles(ws, colCount)
  for (let c = 0; c < colCount; c += 1) {
    setBorderedCenterStyle(ws, `${colLetter(c)}${headerRowIdx + 1}`, {
      bold: true,
      sz: 11,
      fill: HEADER_FILL,
    })
  }
  for (let r = startIdx; r <= endIdx; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      setBorderedCenterStyle(ws, `${colLetter(c)}${r + 1}`, {
        sz: 10.5,
        numFmt: c === 5 ? '0' : undefined,
      })
    }
  }
  for (let c = 0; c < colCount; c += 1) {
    setBorderedCenterStyle(ws, `${colLetter(c)}${totalRowIdx + 1}`, {
      bold: true,
      sz: 11,
      fill: TOTAL_FILL,
      numFmt: c === 5 ? '0' : undefined,
    })
  }

  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIdx + 1 }
  return ws
}

function buildSummarySheet(
  items: LaborProtectionRequisition[],
  filterText: string,
  exportTime: string,
  title = SUMMARY_TITLE,
) {
  const colCount = SUMMARY_HEADERS.length
  const summaries = summarizeByCategory(items)
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  )

  const { data, merges } = buildHeaderRows(
    colCount,
    `${title}（共 ${summaries.length} 类）`,
    filterText,
    exportTime,
  )

  data.push([...SUMMARY_HEADERS])
  const headerRowIdx = data.length - 1

  const startIdx = data.length
  summaries.forEach((s, index) => {
    data.push([index + 1, s.category, s.quantity, s.count])
  })
  const endIdx = data.length - 1

  const totalRow: (string | number)[] = Array.from(
    { length: colCount },
    () => '',
  )
  totalRow[0] = '合计'
  totalRow[2] = totalQuantity
  totalRow[3] = items.length
  data.push(totalRow)
  const totalRowIdx = data.length - 1
  merges.push({
    s: { r: totalRowIdx, c: 0 },
    e: { r: totalRowIdx, c: 1 },
  })

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merges
  setColumnWidths(ws, SUMMARY_COLUMN_WIDTHS)

  const rows: { hpt?: number; hpx?: number }[] = []
  rows[0] = { hpt: 30, hpx: 30 }
  for (let i = 1; i < data.length; i += 1) {
    rows[i] = { hpt: 22, hpx: 22 }
  }
  ws['!rows'] = rows

  applyHeaderStyles(ws, colCount)
  for (let c = 0; c < colCount; c += 1) {
    setBorderedCenterStyle(ws, `${colLetter(c)}${headerRowIdx + 1}`, {
      bold: true,
      sz: 11,
      fill: HEADER_FILL,
    })
  }
  for (let r = startIdx; r <= endIdx; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      setBorderedCenterStyle(ws, `${colLetter(c)}${r + 1}`, {
        sz: 10.5,
        numFmt: c === 2 || c === 3 ? '0' : undefined,
      })
    }
  }
  for (let c = 0; c < colCount; c += 1) {
    setBorderedCenterStyle(ws, `${colLetter(c)}${totalRowIdx + 1}`, {
      bold: true,
      sz: 11,
      fill: TOTAL_FILL,
      numFmt: c === 2 || c === 3 ? '0' : undefined,
    })
  }

  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIdx + 1 }
  return ws
}

function buildWorkbook(
  items: LaborProtectionRequisition[],
  filters: FilterInfo,
) {
  const exportTime = dayjs(new Date()).format('YYYY-MM-DD HH:mm')
  const filterText = buildFilterText(filters)

  const detailWs = buildDetailSheet(items, filterText, exportTime)
  const regularItems = items.filter(
    (item) => !isSawBladeCategory(item.category),
  )
  const sawBladeItems = items.filter((item) =>
    isSawBladeCategory(item.category),
  )
  const summaryWs = buildSummarySheet(regularItems, filterText, exportTime)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, detailWs, DETAIL_SHEET_NAME)
  XLSX.utils.book_append_sheet(wb, summaryWs, SUMMARY_SHEET_NAME)
  if (sawBladeItems.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      buildSummarySheet(
        sawBladeItems,
        filterText,
        exportTime,
        SAW_BLADE_SUMMARY_TITLE,
      ),
      SAW_BLADE_SUMMARY_SHEET_NAME,
    )
  }
  return wb
}

export function exportLaborProtectionRequisitionsToExcel(
  items: LaborProtectionRequisition[],
  filters: FilterInfo,
) {
  const wb = buildWorkbook(items, filters)
  const filename = `劳保领料单_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(wb, filename, EXCEL_WRITE_OPTIONS)
}
