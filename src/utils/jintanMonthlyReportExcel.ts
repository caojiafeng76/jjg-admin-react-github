import type {
  JintanMonthlyReport,
  JintanMonthlyReportRow,
} from '@/services/apiJintanMonthlyReport'
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
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'

export const JINTAN_MONTHLY_REPORT_HEADERS = [
  '#',
  '型号',
  '名称',
  '规格',
  '材质',
  '上月结余',
  '本月入库',
  '本月出库',
  '本月调整',
  '月末结存',
] as const
const COLUMN_WIDTHS = [6, 18, 24, 20, 14, 12, 12, 12, 12, 12]

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
    row.item_model,
    row.item_name,
    row.specification,
    row.material,
    ...JINTAN_MONTHLY_REPORT_QUANTITY_KEYS.map(key => row[key]),
  ])
  const totalRow = ['合计', '', '', '', '', ...sumJintanMonthlyReportRows(rows)]

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
    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 4 } },
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

export function createJintanMonthlyReportWorkbook(
  report: JintanMonthlyReport,
  month: string,
): XLSX.WorkBook {
  const monthLabel = formatJintanReportMonth(month)
  const workbook = XLSX.utils.book_new()

  for (const category of JINTAN_MONTHLY_REPORT_CATEGORIES) {
    const label = JINTAN_MONTHLY_REPORT_CATEGORY_LABELS[category]
    const worksheet = createCategorySheet(
      report[category],
      `金檀木业${label}月度库存报表（${monthLabel}）`,
    )
    XLSX.utils.book_append_sheet(workbook, worksheet, label)
  }

  return workbook
}

export function exportJintanMonthlyReportToExcel(
  report: JintanMonthlyReport,
  month: string,
) {
  const workbook = createJintanMonthlyReportWorkbook(report, month)
  const filename = `金檀木业月度库存报表_${month}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}
