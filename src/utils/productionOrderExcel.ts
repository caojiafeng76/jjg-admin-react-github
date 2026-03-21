import * as XLSX from 'xlsx-js-style'

import type { ProductionOrderForExport } from '@/services/apiProductionOrders'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@utils/excelStyleUtils'

const EXPORT_HEADERS = [
  '日期',
  '出勤工时',
  '工时效率',
  '项目号',
  '产品型号',
  '长度(mm)',
  '工序',
  '单件标准工时(S/支)',
  '合格产量（支数）',
  '合格工时（S）',
  '个人不良产量（支数）',
  '加分项',
  '减分项',
  '考核合计工时(秒)',
  '合计（小时）',
  '备注',
] as const

type ExportRow = Array<string | number>

function normalizeNumber(value: number | null | undefined) {
  return Number(value || 0)
}

function buildExportRow(
  order: ProductionOrderForExport,
  item: ProductionOrderForExport['items'][number],
): ExportRow {
  const qualifiedSeconds =
    normalizeNumber(item.standard_seconds) *
    normalizeNumber(item.qualified_quantity)
  const personalDefectQuantity =
    normalizeNumber(item.defect_quantity_1) +
    normalizeNumber(item.defect_quantity_2)
  const bonusSeconds = normalizeNumber(item.bonus_seconds)
  const penaltySeconds = Math.round(normalizeNumber(item.defect_hours) * 3600)
  const assessedSeconds = qualifiedSeconds + bonusSeconds - penaltySeconds
  const totalHours = assessedSeconds / 3600
  const efficiency =
    order.efficiency === null || order.efficiency === undefined
      ? ''
      : `${(order.efficiency * 100).toFixed(2)}%`

  return [
    order.order_date,
    normalizeNumber(order.work_hours),
    efficiency,
    item.project_no,
    item.product_model || '',
    item.length_mm ?? '',
    item.operation,
    normalizeNumber(item.standard_seconds),
    normalizeNumber(item.qualified_quantity),
    qualifiedSeconds,
    personalDefectQuantity,
    bonusSeconds,
    penaltySeconds,
    assessedSeconds,
    totalHours,
    item.remark || order.remark || '',
  ]
}

function sanitizeSheetName(name: string, index: number) {
  const normalized = (name || `员工${index + 1}`)
    .replace(/[\\/?*\[\]:]/g, ' ')
    .trim()

  return (normalized || `员工${index + 1}`).slice(0, 31)
}

function applySheetStyles(
  worksheet: XLSX.WorkSheet,
  rows: Array<Array<string | number | null | undefined>>,
) {
  autoFitColumnWidths(worksheet, rows)
  centerAllCells(worksheet, rows)
  setRowHeight(worksheet, 22, rows.length)

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const headerCellRef = XLSX.utils.encode_cell({ r: 0, c: column })
    if (!worksheet[headerCellRef]) {
      continue
    }

    worksheet[headerCellRef].s = {
      ...(worksheet[headerCellRef].s || {}),
      font: {
        ...(worksheet[headerCellRef].s?.font || {}),
        bold: true,
        name: '宋体',
        sz: 11,
      },
      fill: {
        fgColor: { rgb: 'D9EAF7' },
      },
      border: {
        top: { style: 'thin', color: { rgb: 'B7C9D6' } },
        bottom: { style: 'thin', color: { rgb: 'B7C9D6' } },
        left: { style: 'thin', color: { rgb: 'B7C9D6' } },
        right: { style: 'thin', color: { rgb: 'B7C9D6' } },
      },
    }
  }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
}

export function exportProductionOrdersToExcel(
  orders: ProductionOrderForExport[],
) {
  const workbook = XLSX.utils.book_new()
  const employeeGroups = new Map<string, ExportRow[]>()

  orders.forEach((order) => {
    const employeeName = order.employee?.name || '未分配员工'
    const rows = employeeGroups.get(employeeName) || []

    order.items.forEach((item) => {
      rows.push(buildExportRow(order, item))
    })

    employeeGroups.set(employeeName, rows)
  })

  Array.from(employeeGroups.entries()).forEach(
    ([employeeName, dataRows], index) => {
      const sheetRows: Array<Array<string | number | null | undefined>> = [
        [...EXPORT_HEADERS],
        ...dataRows,
      ]
      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)

      const totalHoursColumnIndex = EXPORT_HEADERS.indexOf('合计（小时）')
      for (let rowIndex = 1; rowIndex < sheetRows.length; rowIndex += 1) {
        const cellRef = XLSX.utils.encode_cell({
          r: rowIndex,
          c: totalHoursColumnIndex,
        })
        if (worksheet[cellRef]) {
          worksheet[cellRef].z = '0.000000000'
        }
      }

      applySheetStyles(worksheet, sheetRows)
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sanitizeSheetName(employeeName, index),
      )
    },
  )

  ;(workbook as XLSX.WorkBook & { Workbook?: Record<string, unknown> }).Workbook = {
    CalcPr: {
      calcMode: 'auto',
      fullCalcOnLoad: '1',
      forceFullCalc: '1',
    },
  }

  XLSX.writeFile(
    workbook,
    `生产工单导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}