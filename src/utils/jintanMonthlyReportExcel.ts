import type {
  JintanMonthlyReport,
  JintanMonthlyReportRow,
} from '@/services/apiJintanMonthlyReport'
import type { JintanItemType } from '@/services/jintanItemType'
import dayjs from 'dayjs'

import * as XLSX from 'xlsx-js-style'
import {
  formatJintanReportMonth,
  JINTAN_MONTHLY_REPORT_QUANTITY_KEYS,
  sumJintanMonthlyReportRows,
} from '@/features/jintan/MonthlyReport/reportUtils'
import {
  JINTAN_MONTHLY_REPORT_CATEGORIES,
  JINTAN_MONTHLY_REPORT_CATEGORY_LABELS,
} from '@/services/apiJintanMonthlyReport'
import { JINTAN_ITEM_TYPES } from '@/services/jintanItemType'
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'

export const JINTAN_MONTHLY_REPORT_HEADERS = [
  '#',
  '类型',
  '型号',
  '名称',
  '规格',
  '颜色',
  '材质',
  '上月结余',
  '本月入库',
  '本月出库',
  '本月调整',
  '月末结存',
] as const
const COLUMN_WIDTHS = [6, 6, 18, 24, 20, 10, 14, 12, 12, 12, 12, 12]
/** 合计行合并到「材质」列，后面是数量列 */
const TOTAL_LABEL_COLUMN_COUNT = JINTAN_MONTHLY_REPORT_HEADERS.indexOf('材质') + 1

function createCategorySheet(
  rows: JintanMonthlyReportRow[],
  title: string,
): XLSX.WorkSheet {
  const columnCount = JINTAN_MONTHLY_REPORT_HEADERS.length
  const titleRow: Array<string | number> = Array.from(
    { length: columnCount },
    () => '',
  )
  titleRow[0] = title

  const bodyRows = rows.map((row, index) => [
    index + 1,
    row.item_type,
    row.item_model,
    row.item_name,
    row.specification,
    row.item_color,
    row.material,
    ...JINTAN_MONTHLY_REPORT_QUANTITY_KEYS.map(key => row[key]),
  ])
  const totalRow = [
    '合计',
    ...Array.from({ length: TOTAL_LABEL_COLUMN_COUNT - 1 }, () => ''),
    ...sumJintanMonthlyReportRows(rows),
  ]

  const worksheetData = [
    titleRow,
    Array.from(JINTAN_MONTHLY_REPORT_HEADERS),
    ...bodyRows,
    totalRow,
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const totalRowIndex = worksheetData.length - 1

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: TOTAL_LABEL_COLUMN_COUNT - 1 } },
  ]

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths: COLUMN_WIDTHS,
    freezeYSplit: 2,
  })

  for (let col = 0; col < columnCount; col += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: totalRowIndex, c: col })]
    if (cell) {
      cell.s = { ...cell.s, font: { ...cell.s?.font, bold: true } }
    }
  }

  return worksheet
}

/**
 * 按「配件A、配件B、型材A、型材B、素材A、素材B」顺序生成工作表；
 * 传 itemType 时只生成该类型的工作表。
 */
export function createJintanMonthlyReportWorkbook(
  report: JintanMonthlyReport,
  month: string,
  itemType?: JintanItemType,
): XLSX.WorkBook {
  const monthLabel = formatJintanReportMonth(month)
  const workbook = XLSX.utils.book_new()
  const itemTypes = itemType ? [itemType] : JINTAN_ITEM_TYPES

  for (const category of JINTAN_MONTHLY_REPORT_CATEGORIES) {
    const label = JINTAN_MONTHLY_REPORT_CATEGORY_LABELS[category]
    for (const type of itemTypes) {
      const worksheet = createCategorySheet(
        report[category].filter(row => row.item_type === type),
        `金檀木业${label}${type}月度库存报表（${monthLabel}）`,
      )
      XLSX.utils.book_append_sheet(workbook, worksheet, `${label}${type}`)
    }
  }

  return workbook
}

export function exportJintanMonthlyReportToExcel(
  report: JintanMonthlyReport,
  month: string,
  itemType?: JintanItemType,
) {
  const workbook = createJintanMonthlyReportWorkbook(report, month, itemType)
  const typeSuffix = itemType ? `_${itemType}类` : ''
  const filename = `金檀木业月度库存报表${typeSuffix}_${month}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}
