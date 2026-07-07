import { useCallback, useState } from 'react'
import { App } from 'antd'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import {
  EXCEL_WRITE_OPTIONS,
  applyRegisterSheetStyles,
} from '@/utils/excelStyleUtils'
import type { PackagingWorkOrder } from '@/services/apiPackagingWorkOrders'

interface ExportInput {
  orders: PackagingWorkOrder[]
  searchParams?: {
    startDate?: string
    endDate?: string
    employeeId?: string
    keyword?: string
  }
}

const DETAIL_HEADERS = [
  '日期',
  '人员',
  '项目号',
  '型号',
  '颜色',
  '工艺',
  '长度(mm)',
  '料号',
  '单位',
  '数量',
  '标时/s',
  '时间(小时)',
  '零工(小时)',
  '合计(小时)',
] as const

const DETAIL_COLUMN_WIDTHS = [12, 10, 14, 16, 8, 8, 12, 12, 6, 8, 8, 10, 10, 10] as const

function formatDate(value: string | null | undefined) {
  return value ? dayjs(value).format('MM-DD') : ''
}

function formatHours(value: number | null | undefined) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function getTotalHours(order: PackagingWorkOrder) {
  return (
    (Number(order.work_hours) || 0) +
    (Number(order.extra_qualified_hours) || 0)
  )
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
  URL.revokeObjectURL(url)
}

function buildDetailSheet(orders: PackagingWorkOrder[]) {
  const sorted = [...orders].sort((a, b) => {
    const dateCompare = (a.work_date || '').localeCompare(b.work_date || '')
    if (dateCompare !== 0) return dateCompare
    return (a.employee_name || '').localeCompare(b.employee_name || '', 'zh-CN')
  })

  const rows = sorted.map((order) => [
    formatDate(order.work_date),
    formatCellText(order.employee_name),
    formatCellText(order.project_no),
    formatCellText(order.product_model),
    formatCellText(order.color_name),
    formatCellText(order.process_name),
    formatCellText(order.length_mm),
    formatCellText(order.part_no),
    formatCellText(order.unit),
    formatCellText(order.quantity),
    formatCellText(order.standard_seconds),
    formatHours(order.work_hours),
    formatHours(order.extra_qualified_hours),
    formatHours(getTotalHours(order)),
  ])

  const data: Array<Array<string | number>> = [
    ['包装车间工时清单', ...DETAIL_HEADERS.slice(1).map(() => '')],
    Array.from(DETAIL_HEADERS),
    ...rows,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(data)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: DETAIL_HEADERS.length - 1 } },
  ]
  applyRegisterSheetStyles(worksheet, data, {
    columnWidths: Array.from(DETAIL_COLUMN_WIDTHS),
  })

  return worksheet
}

function buildPivotSheet(orders: PackagingWorkOrder[]) {
  const employees = Array.from(
    new Set(
      orders
        .map((order) => order.employee_name)
        .filter((name): name is string => !!name),
    ),
  )

  const dates = Array.from(
    new Set(orders.map((order) => order.work_date).filter(Boolean)),
  ).sort()

  const totalByDateEmployee = new Map<string, number>()
  const totalByDate = new Map<string, number>()
  const totalByEmployee = new Map<string, number>()
  const hourlyWageByEmployee = new Map<string, number>()
  const positionSalaryByEmployee = new Map<string, number>()
  let grandTotal = 0

  for (const order of orders) {
    const hours = getTotalHours(order)
    const date = order.work_date
    const emp = order.employee_name
    if (!date || !emp) continue

    const dateEmpKey = `${date}|${emp}`
    totalByDateEmployee.set(
      dateEmpKey,
      (totalByDateEmployee.get(dateEmpKey) || 0) + hours,
    )
    totalByDate.set(date, (totalByDate.get(date) || 0) + hours)
    totalByEmployee.set(emp, (totalByEmployee.get(emp) || 0) + hours)
    if (!hourlyWageByEmployee.has(emp)) {
      hourlyWageByEmployee.set(emp, Number(order.employee_hourly_wage) || 0)
    }
    if (!positionSalaryByEmployee.has(emp)) {
      positionSalaryByEmployee.set(
        emp,
        Number(order.employee_position_salary) || 0,
      )
    }
    grandTotal += hours
  }

  const header: Array<string | number> = ['', ...employees, '合计']
  const bodyRows = dates.map((date) => {
    const row: Array<string | number> = [formatDate(date)]
    for (const emp of employees) {
      const hours = totalByDateEmployee.get(`${date}|${emp}`) || 0
      row.push(hours.toFixed(2))
    }
    row.push((totalByDate.get(date) || 0).toFixed(2))
    return row
  })

  const totalRow: Array<string | number> = ['合计']
  for (const emp of employees) {
    totalRow.push((totalByEmployee.get(emp) || 0).toFixed(2))
  }
  totalRow.push(grandTotal.toFixed(2))

  const hourlyWageRow: Array<string | number> = ['时薪']
  for (const emp of employees) {
    hourlyWageRow.push(formatMoney(hourlyWageByEmployee.get(emp) || 0))
  }
  hourlyWageRow.push('')

  const positionSalaryRow: Array<string | number> = ['岗位工资']
  let totalPositionSalary = 0
  for (const emp of employees) {
    const positionSalary = positionSalaryByEmployee.get(emp) || 0
    totalPositionSalary += positionSalary
    positionSalaryRow.push(formatMoney(positionSalary))
  }
  positionSalaryRow.push(formatMoney(totalPositionSalary))

  const salaryRow: Array<string | number> = ['工资']
  let totalSalary = 0
  for (const emp of employees) {
    const salary =
      (totalByEmployee.get(emp) || 0) * (hourlyWageByEmployee.get(emp) || 0) +
      (positionSalaryByEmployee.get(emp) || 0)
    totalSalary += salary
    salaryRow.push(formatMoney(salary))
  }
  salaryRow.push(formatMoney(totalSalary))

  const data: Array<Array<string | number>> = [
    ['包装车间工时表', ...header.slice(1).map(() => '')],
    header,
    ...bodyRows,
    totalRow,
    hourlyWageRow,
    positionSalaryRow,
    salaryRow,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(data)
  const lastCol = header.length - 1
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
  ]

  applyRegisterSheetStyles(worksheet, data, {
    freezeYSplit: 2,
  })

  return worksheet
}

export function buildWorkbook(orders: PackagingWorkOrder[]) {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, buildDetailSheet(orders), '产量清单')
  XLSX.utils.book_append_sheet(workbook, buildPivotSheet(orders), '工时工资表')

  return XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer
}

export function useExportWorkOrdersAsExcel() {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  const exportAsExcel = useCallback(
    async ({ orders, searchParams }: ExportInput) => {
      if (!orders.length) {
        message.warning('当前页没有可导出的数据')
        return false
      }

      setIsExporting(true)

      try {
        const buffer = buildWorkbook(orders)

        const start = searchParams?.startDate || orders[0]?.work_date
        const end = searchParams?.endDate || orders[orders.length - 1]?.work_date
        const dateLabel = start && end ? `${start}_${end}` : dayjs().format('YYYY-MM-DD')

        downloadExcel(buffer, `包装生产工单_${dateLabel}.xlsx`)
        message.success('生产工单 Excel 导出成功')
        return true
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '生产工单 Excel 导出失败',
        )
        return false
      } finally {
        setIsExporting(false)
      }
    },
    [message],
  )

  return { exportAsExcel, isExporting }
}
