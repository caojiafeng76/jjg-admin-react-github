import * as XLSX from 'xlsx-js-style'

import type {
  AttendanceLateEarlyStat,
  AttendanceMonthlyRow,
} from '@/services/apiAttendanceDetails'
import { EXCEL_WRITE_OPTIONS } from './excelStyleUtils'

/** 返回指定年月的天数 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

interface EmployeeMonthData {
  job_name: string
  /** key: day (1-31), value: { work_hours, shift, specialRemark } */
  days: Record<
    number,
    { work_hours: number; shift: string; specialRemark?: string | null }
  >
}

const SPECIAL_REMARK_KEYWORDS = ['休息', '请假', '放假', '转班']

function getSpecialRemark(row: AttendanceMonthlyRow): string | null {
  const remark = row.remark?.trim()

  if (!remark || row.work_hours !== 0) {
    return null
  }

  return SPECIAL_REMARK_KEYWORDS.some((keyword) => remark.includes(keyword))
    ? remark
    : null
}

function formatDayCellValue(day?: {
  work_hours: number
  specialRemark?: string | null
}): string | number | null {
  if (!day) {
    return null
  }

  if (day.specialRemark && day.work_hours === 0) {
    return day.specialRemark
  }

  return Number.isInteger(day.work_hours)
    ? day.work_hours
    : parseFloat(day.work_hours.toFixed(2))
}

function getOrderDay(orderDate: string): number {
  return Number(orderDate.slice(8, 10))
}

/** 将 RPC 返回的扁平行数据聚合为按员工/天的结构 */
function aggregateByEmployee(
  rows: AttendanceMonthlyRow[],
): Map<string, EmployeeMonthData> {
  const map = new Map<string, EmployeeMonthData>()
  for (const row of rows) {
    const day = getOrderDay(row.order_date)
    const specialRemark = getSpecialRemark(row)

    if (!map.has(row.employee_name)) {
      map.set(row.employee_name, {
        job_name: row.job_name,
        days: {},
      })
    }
    const emp = map.get(row.employee_name)!

    // 同一天可能有多条（多道工序），累加工时，夜班优先
    const existing = emp.days[day]
    if (existing) {
      existing.work_hours += row.work_hours
      if (row.shift === '夜班') existing.shift = '夜班'
      if (specialRemark) existing.specialRemark = specialRemark
    } else {
      emp.days[day] = {
        work_hours: row.work_hours,
        shift: row.shift,
        specialRemark,
      }
    }
  }
  return map
}

const BORDER_THIN = {
  style: 'thin',
  color: { rgb: '000000' },
}

const CELL_BORDER = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
}

/** 夜班单元格的黄色填充 */
const NIGHT_SHIFT_FILL = {
  patternType: 'solid',
  fgColor: { rgb: 'FFFF00' },
}

/** 普通单元格样式（含边框、居中、宋体） */
function baseStyle(opts: { bold?: boolean; bg?: string } = {}) {
  return {
    font: { name: '宋体', sz: 11, bold: opts.bold },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: CELL_BORDER,
    ...(opts.bg
      ? { fill: { patternType: 'solid', fgColor: { rgb: opts.bg } } }
      : {}),
  }
}

function appendAttendanceMonthlyWorksheet(
  wb: XLSX.WorkBook,
  rows: AttendanceMonthlyRow[],
  year: number,
  month: number,
  sheetName: string,
  titleSuffix: string,
) {
  const totalDays = daysInMonth(year, month)
  const employeeMap = aggregateByEmployee(rows)
  const employeeNames = Array.from(employeeMap.keys())

  // ── 列定义 ──────────────────────────────────────────────
  // 编号(0) | 岗位(1) | 姓名(2) | 1..totalDays | 合计 | 天数 | 备注
  const dayColStart = 3
  const totalCol = dayColStart + totalDays
  const daysCol = totalCol + 1
  const remarkCol = daysCol + 1
  const totalCols = remarkCol + 1

  // ── 构建二维数组（用于 autoFitColumnWidths 计算） ────────
  // Row 0: 标题行（合并）
  // Row 1: 表头行
  // Row 2+: 数据行
  const sheetData: (string | number | null)[][] = []

  // 标题行
  const titleRow: (string | number | null)[] = Array(totalCols).fill(null)
  titleRow[0] = `精加工${year}-${month}月份出勤明细表${titleSuffix}`
  sheetData.push(titleRow)

  // 表头行
  const headerRow: (string | number | null)[] = [
    '编号',
    '岗位',
    '姓名',
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
    '合计',
    '天数',
    '备注',
  ]
  sheetData.push(headerRow)

  // 数据行
  employeeNames.forEach((name, idx) => {
    const emp = employeeMap.get(name)!
    const row: (string | number | null)[] = [idx + 1, emp.job_name, name]
    let totalHours = 0
    let daysCount = 0
    for (let d = 1; d <= totalDays; d++) {
      const day = emp.days[d]
      if (day) {
        row.push(formatDayCellValue(day))
        totalHours += day.work_hours
        if (!(day.specialRemark && day.work_hours === 0)) {
          daysCount += 1
        }
      } else {
        row.push(null)
      }
    }
    row.push(parseFloat(totalHours.toFixed(2)))
    row.push(daysCount)
    row.push(null) // 备注留空
    sheetData.push(row)
  })

  // ── 创建工作表 ────────────────────────────────────────
  const ws: XLSX.WorkSheet = {}

  // 定义范围
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: sheetData.length - 1, c: totalCols - 1 },
  })

  // 标题行合并
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }]

  // 写入每个单元格
  sheetData.forEach((rowData, rowIdx) => {
    rowData.forEach((cellVal, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })

      if (rowIdx === 0) {
        // 标题行
        ws[cellRef] = {
          v: cellVal ?? '',
          t: 's',
          s: {
            font: { name: '宋体', sz: 14, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: CELL_BORDER,
          },
        }
        return
      }

      if (rowIdx === 1) {
        // 表头行
        ws[cellRef] = {
          v: cellVal ?? '',
          t: typeof cellVal === 'number' ? 'n' : 's',
          s: baseStyle({ bold: true, bg: 'D9E1F2' }),
        }
        return
      }

      // 数据行
      const dataRowIdx = rowIdx - 2
      const isNightShift =
        colIdx >= dayColStart &&
        colIdx < totalCol &&
        (() => {
          const day = colIdx - dayColStart + 1
          const emp = employeeMap.get(employeeNames[dataRowIdx])
          return emp?.days[day]?.shift === '夜班'
        })()

      ws[cellRef] = {
        v: cellVal ?? '',
        t: cellVal === null ? 's' : typeof cellVal === 'number' ? 'n' : 's',
        s: {
          ...baseStyle(isNightShift ? {} : {}),
          ...(isNightShift ? { fill: NIGHT_SHIFT_FILL } : {}),
          font: { name: '宋体', sz: 11 },
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
          },
          border: CELL_BORDER,
        },
      }
    })
  })

  // ── 列宽 ──────────────────────────────────────────────
  // 编号: 6, 岗位: 8, 姓名: 10, 日期列: 4, 合计: 7, 天数: 6, 备注: 12
  const colWidths: { wch: number }[] = [
    { wch: 6 }, // 编号
    { wch: 8 }, // 岗位
    { wch: 10 }, // 姓名
    ...Array(totalDays).fill({ wch: 4.5 }),
    { wch: 7 }, // 合计
    { wch: 6 }, // 天数
    { wch: 12 }, // 备注
  ]
  ws['!cols'] = colWidths

  // ── 行高 ──────────────────────────────────────────────
  const rowHeights: { hpt: number }[] = [
    { hpt: 28 }, // 标题行
    { hpt: 22 }, // 表头行
    ...Array(employeeNames.length).fill({ hpt: 20 }),
  ]
  ws['!rows'] = rowHeights

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

/**
 * 导出月度考勤明细表 Excel
 * @param rows   RPC 返回的原始数据
 * @param year   年份
 * @param month  月份 (1-12)
 */
export function exportAttendanceMonthlyExcel(
  rows: AttendanceMonthlyRow[],
  year: number,
  month: number,
) {
  const wb = XLSX.utils.book_new()
  const monthLabel = `${year}-${String(month).padStart(2, '0')}`

  appendAttendanceMonthlyWorksheet(
    wb,
    rows.filter((row) => row.is_external !== true),
    year,
    month,
    `${monthLabel}-非外来`,
    '（非外来）',
  )
  appendAttendanceMonthlyWorksheet(
    wb,
    rows.filter((row) => row.is_external === true),
    year,
    month,
    `${monthLabel}-外来`,
    '（外来）',
  )

  XLSX.writeFile(
    wb,
    `精加工${year}-${month}月份出勤明细表.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}

/**
 * 导出迟到/早退统计表 Excel
 * @param data   RPC 返回的迟到/早退统计数据
 * @param dateRange 用于标题显示的日期范围（可选）
 */
export function exportAttendanceLateEarlyExcel(
  data: AttendanceLateEarlyStat[],
  dateRange?: { startDate?: string; endDate?: string },
) {
  const rangeStr =
    dateRange?.startDate && dateRange?.endDate
      ? `（${dateRange.startDate} ~ ${dateRange.endDate}）`
      : dateRange?.startDate
        ? `（${dateRange.startDate} 起）`
        : dateRange?.endDate
          ? `（截至 ${dateRange.endDate}）`
          : ''
  const title = `迟到/早退统计表${rangeStr}`

  // 表头
  const headers = [
    '编号',
    '姓名',
    '迟到次数',
    '迟到日期',
    '早退次数',
    '早退日期',
  ]
  const colCount = headers.length

  // 数据行
  const dataRows = data.map((row, idx) => [
    idx + 1,
    row.name,
    row.late_count,
    row.late_dates.join('、'),
    row.early_leave_count,
    row.early_leave_dates.join('、'),
  ])

  const allRows = [[title, null, null, null, null, null], headers, ...dataRows]

  const ws: XLSX.WorkSheet = {}
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: allRows.length - 1, c: colCount - 1 },
  })

  // 标题行合并
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }]

  allRows.forEach((rowData, rowIdx) => {
    rowData.forEach((cellVal, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })
      if (rowIdx === 0) {
        ws[cellRef] = {
          v: cellVal ?? '',
          t: 's',
          s: {
            font: { name: '宋体', sz: 13, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: CELL_BORDER,
          },
        }
        return
      }
      if (rowIdx === 1) {
        ws[cellRef] = {
          v: cellVal ?? '',
          t: 's',
          s: baseStyle({ bold: true, bg: 'D9E1F2' }),
        }
        return
      }

      // 迟到/早退次数列橙色/红色高亮（有数据时）
      const isLateCount = colIdx === 2 && (cellVal as number) > 0
      const isEarlyCount = colIdx === 4 && (cellVal as number) > 0

      ws[cellRef] = {
        v: cellVal ?? '',
        t:
          cellVal === null || cellVal === ''
            ? 's'
            : typeof cellVal === 'number'
              ? 'n'
              : 's',
        s: {
          font: { name: '宋体', sz: 11 },
          alignment: {
            horizontal: colIdx >= 3 ? 'left' : 'center',
            vertical: 'center',
            wrapText: colIdx === 3 || colIdx === 5,
          },
          border: CELL_BORDER,
          ...(isLateCount
            ? { fill: { patternType: 'solid', fgColor: { rgb: 'FFE0B2' } } }
            : isEarlyCount
              ? { fill: { patternType: 'solid', fgColor: { rgb: 'FFCCBC' } } }
              : {}),
        },
      }
    })
  })

  // 列宽
  ws['!cols'] = [
    { wch: 6 }, // 编号
    { wch: 10 }, // 姓名
    { wch: 10 }, // 迟到次数
    { wch: 40 }, // 迟到日期
    { wch: 10 }, // 早退次数
    { wch: 40 }, // 早退日期
  ]

  // 行高
  ws['!rows'] = [
    { hpt: 28 },
    { hpt: 22 },
    ...Array(dataRows.length).fill({ hpt: 20 }),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '迟到早退统计')
  XLSX.writeFile(
    wb,
    `迟到早退统计表${rangeStr ? rangeStr.replace(/[（）]/g, '') : ''}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
