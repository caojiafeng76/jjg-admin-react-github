import XLSX from 'xlsx-js-style'

import type { ProductionSchedulingProcessRow } from '@/services/apiProductionScheduling'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from './excelStyleUtils'

const PLAN_HEADERS = [
  '序号',
  '工序',
  '时间',
  '项目（型号）',
  '订单数量',
  '计划数量',
  '工作内容',
  '计划完成时间',
  '完成状态',
  '操作人/人数',
  '备注',
] as const

const COLUMN_WIDTHS = [8, 12, 10, 28, 12, 12, 14, 16, 14, 16, 36]
const SUMMARY_ROW_COUNT = 5
const BORDER_COLOR = '000000'

type SheetCellValue = string | number

type WorksheetData = SheetCellValue[][]

function getColumnLetter(columnIndex: number) {
  let letter = ''
  let index = columnIndex

  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter
    index = Math.floor(index / 26) - 1
  }

  return letter
}

function normalizeNumber(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getMonth() + 1}-${date.getDate()}`
}

function formatTitleDate(value: string | null | undefined) {
  if (!value) {
    return '生产计划'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return `${value}生产计划`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日生产计划`
}

function sanitizeSheetName(value: string, index: number) {
  const normalized = value.replace(/[[\]\\/?*:]/g, ' ').trim()
  return (normalized || `生产计划${index + 1}`).slice(0, 31)
}

function buildProjectText(row: ProductionSchedulingProcessRow) {
  const projectNo = row.order.project_no?.trim() || ''
  const productModel = row.order.product_model?.trim() || ''

  if (projectNo && productModel) {
    return `${projectNo} ${productModel}`
  }

  return projectNo || productModel || ''
}

function buildPlanRow(
  row: ProductionSchedulingProcessRow,
  index: number,
): SheetCellValue[] {
  return [
    index + 1,
    row.schedule.process_name || '',
    '',
    buildProjectText(row),
    normalizeNumber(row.order.order_quantity),
    normalizeNumber(row.schedule.scheduled_quantity),
    row.schedule.process_name || '',
    formatDate(row.schedule.scheduled_date),
    '',
    row.schedule.operator_name || '',
    row.schedule.remark || '',
  ]
}

function buildWorksheetData(
  rows: ProductionSchedulingProcessRow[],
  scheduledDate: string,
): WorksheetData {
  const data: WorksheetData = [
    [formatTitleDate(scheduledDate), ...PLAN_HEADERS.slice(1).map(() => '')],
    [
      '班次：',
      '',
      '加工：',
      '',
      '',
      '',
      '',
      '',
      `日期：${formatDate(scheduledDate)}`,
      '',
      '',
    ],
    [...PLAN_HEADERS],
    ...rows.map(buildPlanRow),
  ]

  for (let index = 0; index < SUMMARY_ROW_COUNT; index += 1) {
    data.push([
      index === 0 ? '每日\n小结' : '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ])
  }

  data.push(['', '', '', '', '', '', '', '', '车间主任：', '', ''])

  return data
}

function groupRowsByDate(rows: ProductionSchedulingProcessRow[]) {
  const grouped = new Map<string, ProductionSchedulingProcessRow[]>()

  rows.forEach((row) => {
    const key = row.schedule.scheduled_date || '未定日期'
    const groupRows = grouped.get(key) || []
    groupRows.push(row)
    grouped.set(key, groupRows)
  })

  return Array.from(grouped.entries()).sort(([leftDate], [rightDate]) =>
    leftDate.localeCompare(rightDate),
  )
}

function applyWorksheetStyles(
  worksheet: XLSX.WorkSheet,
  data: WorksheetData,
  planRowCount: number,
) {
  setColumnWidths(worksheet, COLUMN_WIDTHS)

  worksheet['!rows'] = data.map((_, index) => {
    if (index === 0) return { hpt: 28, hpx: 28 }
    if (index === 1) return { hpt: 24, hpx: 24 }
    if (index === 2) return { hpt: 22, hpx: 22 }
    if (
      index >= planRowCount + 3 &&
      index < planRowCount + 3 + SUMMARY_ROW_COUNT
    ) {
      return { hpt: 34, hpx: 34 }
    }
    return { hpt: 22, hpx: 22 }
  })

  const rowCount = data.length
  const colCount = PLAN_HEADERS.length

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const cellRef = `${getColumnLetter(colIndex)}${rowIndex + 1}`

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          name: '宋体',
          sz: rowIndex === 0 ? 16 : 11,
          bold: rowIndex <= 2 || rowIndex === rowCount - 1,
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: { style: 'thin', color: { rgb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: BORDER_COLOR } },
        },
      }

      if (rowIndex === 2) {
        worksheet[cellRef].s = {
          ...(worksheet[cellRef].s || {}),
          fill: { fgColor: { rgb: 'F2F2F2' } },
        }
      }
    }
  }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 3 }
}

function createWorksheet(
  rows: ProductionSchedulingProcessRow[],
  scheduledDate: string,
) {
  const data = buildWorksheetData(rows, scheduledDate)
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  const summaryStartRow = rows.length + 3
  const summaryEndRow = summaryStartRow + SUMMARY_ROW_COUNT - 1
  const merges: NonNullable<XLSX.WorkSheet['!merges']> = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: PLAN_HEADERS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: 7 } },
    { s: { r: 1, c: 8 }, e: { r: 1, c: 10 } },
    { s: { r: summaryStartRow, c: 0 }, e: { r: summaryEndRow, c: 0 } },
  ]

  for (
    let rowIndex = summaryStartRow;
    rowIndex <= summaryEndRow;
    rowIndex += 1
  ) {
    merges.push({
      s: { r: rowIndex, c: 1 },
      e: { r: rowIndex, c: PLAN_HEADERS.length - 1 },
    })
  }

  worksheet['!merges'] = merges
  applyWorksheetStyles(worksheet, data, rows.length)

  return worksheet
}

function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

export function exportProductionScheduledPlanToExcel(
  rows: ProductionSchedulingProcessRow[],
) {
  const workbook = XLSX.utils.book_new()
  const groupedRows = groupRowsByDate(rows)

  groupedRows.forEach(([scheduledDate, groupRows], index) => {
    const worksheet = createWorksheet(groupRows, scheduledDate)
    const sheetName = sanitizeSheetName(
      scheduledDate === '未定日期'
        ? '未定日期'
        : `${formatDate(scheduledDate)}生产计划`,
      index,
    )

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  const buffer = XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer

  downloadExcel(
    buffer,
    `已排生产计划_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
