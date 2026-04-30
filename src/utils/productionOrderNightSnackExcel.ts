import XLSX from 'xlsx-js-style'

import type { ProductionOrderForExport } from '@/services/apiProductionOrders'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from '@utils/excelStyleUtils'

const NIGHT_SNACK_SHEET_NAME = '夜宵明细表'
const NIGHT_SNACK_HEADERS = [
  '编号',
  '岗位',
  '姓名',
  '夜班',
  '标准',
  '合计',
  '备注',
] as const
const NIGHT_SNACK_STANDARD_AMOUNT = 10
const NIGHT_SNACK_EXCLUDED_REMARK_KEYWORDS = ['休息', '请假', '放假', '转班']

type NightSnackRow = Array<string | number>

export interface ProductionOrderNightSnackExportResult {
  employeeCount: number
  nightShiftCount: number
}

function normalizeNumber(value: number | null | undefined) {
  return Number(value || 0)
}

function shouldCountNightSnackOrder(order: ProductionOrderForExport) {
  if (order.shift !== '夜班') {
    return false
  }

  if (normalizeNumber(order.work_hours) !== 0) {
    return true
  }

  const remark = order.remark?.trim()

  if (!remark) {
    return true
  }

  return !NIGHT_SNACK_EXCLUDED_REMARK_KEYWORDS.some((keyword) =>
    remark.includes(keyword),
  )
}

function getEmployeeJobName(orders: ProductionOrderForExport[]) {
  return (
    orders.find((order) => order.employee?.job_name)?.employee?.job_name || ''
  )
}

function compareEmployeeGroupsByMissingJobFirst(
  [, leftOrders]: [string, ProductionOrderForExport[]],
  [, rightOrders]: [string, ProductionOrderForExport[]],
) {
  const leftHasJobName = Boolean(getEmployeeJobName(leftOrders).trim())
  const rightHasJobName = Boolean(getEmployeeJobName(rightOrders).trim())

  if (leftHasJobName === rightHasJobName) {
    return 0
  }

  return leftHasJobName ? 1 : -1
}

function getReportMonthParts(orders: ProductionOrderForExport[]) {
  const orderDate = [...orders]
    .map((order) => order.order_date)
    .filter(Boolean)
    .sort()[0]
  const fallbackDate = new Date().toISOString().slice(0, 10)
  const [year, month] = (orderDate || fallbackDate).split('-')

  return {
    year,
    month: Number(month),
  }
}

function getReportTitle(orders: ProductionOrderForExport[]) {
  const { year, month } = getReportMonthParts(orders)

  return `精加工${year}-${month}月份夜宵明细表`
}

function getSignatureDate(orders: ProductionOrderForExport[]) {
  const { month } = getReportMonthParts(orders)
  const nextMonth = month === 12 ? 1 : month + 1

  return `${nextMonth}月1日`
}

function getNightSnackExportFilename(orders: ProductionOrderForExport[]) {
  const { year, month } = getReportMonthParts(orders)

  return `精加工${year}-${month}月份夜宵明细表.xlsx`
}

function buildNightSnackRows(
  orders: ProductionOrderForExport[],
  statistician: string,
) {
  const employeeGroups = new Map<string, ProductionOrderForExport[]>()
  const nightSnackOrders = orders.filter(shouldCountNightSnackOrder)

  nightSnackOrders.forEach((order) => {
    const employeeName = order.employee?.name || '未分配员工'
    const employeeOrders = employeeGroups.get(employeeName) || []

    employeeOrders.push(order)
    employeeGroups.set(employeeName, employeeOrders)
  })

  const employeeGroupEntries = Array.from(employeeGroups.entries()).sort(
    compareEmployeeGroupsByMissingJobFirst,
  )
  const rows: NightSnackRow[] = [
    [getReportTitle(nightSnackOrders)],
    [...NIGHT_SNACK_HEADERS],
  ]
  let nightShiftTotal = 0

  employeeGroupEntries.forEach(([employeeName, employeeOrders], index) => {
    const nightShiftCount = employeeOrders.length

    nightShiftTotal += nightShiftCount
    rows.push([
      index + 1,
      getEmployeeJobName(employeeOrders),
      employeeName,
      nightShiftCount,
      NIGHT_SNACK_STANDARD_AMOUNT,
      nightShiftCount * NIGHT_SNACK_STANDARD_AMOUNT,
      '',
    ])
  })

  rows.push([
    employeeGroupEntries.length + 1,
    '合计',
    '',
    nightShiftTotal,
    NIGHT_SNACK_STANDARD_AMOUNT,
    nightShiftTotal * NIGHT_SNACK_STANDARD_AMOUNT,
    '',
  ])
  rows.push(['统计:', statistician, '', '审核:', '', '', ''])
  rows.push([
    '日期:',
    getSignatureDate(nightSnackOrders),
    '',
    '日期:',
    '',
    '',
    '',
  ])

  return {
    employeeCount: employeeGroupEntries.length,
    filename: getNightSnackExportFilename(nightSnackOrders),
    nightShiftCount: nightShiftTotal,
    rows,
  }
}

function applyNightSnackSheetStyles(
  worksheet: XLSX.WorkSheet,
  rows: NightSnackRow[],
) {
  setColumnWidths(worksheet, [10, 12, 16, 10, 10, 14, 18])
  worksheet['!rows'] = rows.map((_, index) => ({ hpt: index === 0 ? 26 : 22 }))
  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: NIGHT_SNACK_HEADERS.length - 1 },
    },
  ]

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: column })

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          name: '宋体',
          sz: row === 0 ? 16 : 11,
          bold: row === 0,
        },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      }

      if (
        column >= 3 &&
        column <= 5 &&
        row >= 2 &&
        typeof worksheet[cellRef].v === 'number'
      ) {
        worksheet[cellRef].z = '0'
      }
    }
  }
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

export function exportProductionOrderNightSnackDetailsToExcel(
  orders: ProductionOrderForExport[],
  options: { statistician?: string } = {},
): ProductionOrderNightSnackExportResult {
  const { employeeCount, filename, nightShiftCount, rows } =
    buildNightSnackRows(orders, options.statistician || '')

  if (nightShiftCount === 0) {
    return { employeeCount, nightShiftCount }
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  applyNightSnackSheetStyles(worksheet, rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, NIGHT_SNACK_SHEET_NAME)

  const buffer = XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer

  downloadExcel(buffer, filename)

  return { employeeCount, nightShiftCount }
}
