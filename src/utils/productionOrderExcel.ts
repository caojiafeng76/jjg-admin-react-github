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
  '正工工时(h)',
  '零工工时(h)',
  '总工时(h)',
  '工时效率',
  '班别',
  '数据类别',
  '项目号',
  '产品型号',
  '长度(mm)',
  '工序',
  '单件标准工时(S/支)',
  '来料接收数',
  '成品合格产量（支数）',
  '工序工时(h)',
  '个人不良产量（支数）',
  '减分工时(h)',
  '备注',
] as const

const SUMMARY_SHEET_NAME = '汇总表'
const SUMMARY_TITLE = '精加工车间员工月工时汇总表'
const SUMMARY_HEADERS = [
  '序号',
  '姓名',
  '出勤工时',
  '正工工时',
  '零工工时',
  '总工时',
  '时薪',
  '系数',
  '工资',
  '备注',
] as const

type ExportRow = Array<string | number>
type SummaryRow = Array<string | number>

const ORDER_DATE_COLUMN_INDEX = EXPORT_HEADERS.indexOf('日期')
const WORK_HOURS_COLUMN_INDEX = EXPORT_HEADERS.indexOf('出勤工时')
const POSITIVE_QUALIFIED_HOURS_COLUMN_INDEX =
  EXPORT_HEADERS.indexOf('正工工时(h)')
const EXTRA_QUALIFIED_HOURS_COLUMN_INDEX = EXPORT_HEADERS.indexOf('零工工时(h)')
const TOTAL_HOURS_COLUMN_INDEX = EXPORT_HEADERS.indexOf('总工时(h)')
const EFFICIENCY_COLUMN_INDEX = EXPORT_HEADERS.indexOf('工时效率')
const SHIFT_COLUMN_INDEX = EXPORT_HEADERS.indexOf('班别')
const REMARK_COLUMN_INDEX = EXPORT_HEADERS.indexOf('备注')

function normalizeNumber(value: number | null | undefined) {
  return Number(value || 0)
}

function getOrderPositiveQualifiedHours(order: ProductionOrderForExport) {
  return Number(
    order.items
      .reduce((total, item) => total + normalizeNumber(item.qualified_hours), 0)
      .toFixed(2),
  )
}

function buildExportRow(
  order: ProductionOrderForExport,
  item: ProductionOrderForExport['items'][number],
  positiveQualifiedHours: number,
): ExportRow {
  const personalDefectQuantity =
    normalizeNumber(item.defect_quantity_1) +
    normalizeNumber(item.defect_quantity_2)
  const penaltyHours = normalizeNumber(item.defect_hours)
  const efficiency =
    order.efficiency === null || order.efficiency === undefined
      ? ''
      : `${(order.efficiency * 100).toFixed(2)}%`

  return [
    order.order_date,
    normalizeNumber(order.work_hours),
    positiveQualifiedHours,
    normalizeNumber(order.extra_qualified_hours),
    normalizeNumber(order.total_qualified_hours),
    efficiency,
    order.shift || '白班',
    item.data_category || 'A',
    item.project_no,
    item.product_model || '',
    item.length_mm ?? '',
    item.operation,
    normalizeNumber(item.standard_seconds),
    normalizeNumber(item.incoming_qualified_quantity),
    normalizeNumber(item.qualified_quantity),
    normalizeNumber(item.qualified_hours),
    personalDefectQuantity,
    penaltyHours,
    item.remark || order.remark || '',
  ]
}

function buildEmptyExportRow(order: ProductionOrderForExport): ExportRow {
  const positiveQualifiedHours = getOrderPositiveQualifiedHours(order)
  const efficiency =
    order.efficiency === null || order.efficiency === undefined
      ? ''
      : `${(order.efficiency * 100).toFixed(2)}%`

  return [
    order.order_date,
    normalizeNumber(order.work_hours),
    positiveQualifiedHours,
    normalizeNumber(order.extra_qualified_hours),
    normalizeNumber(order.total_qualified_hours),
    efficiency,
    order.shift || '白班',
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
    '',
    order.remark || '',
  ]
}

function shouldMergeOrderRemark(rows: ExportRow[]) {
  if (rows.length <= 1) {
    return false
  }

  const firstRemark = String(rows[0][REMARK_COLUMN_INDEX] ?? '')
  return rows.every(
    (row) => String(row[REMARK_COLUMN_INDEX] ?? '') === firstRemark,
  )
}

function buildOrderSheetRows(
  order: ProductionOrderForExport,
  startRowIndex: number,
) {
  const positiveQualifiedHours = getOrderPositiveQualifiedHours(order)
  const rawRows =
    order.items.length > 0
      ? order.items.map((item) =>
          buildExportRow(order, item, positiveQualifiedHours),
        )
      : [buildEmptyExportRow(order)]
  const mergeRemark = shouldMergeOrderRemark(rawRows)

  const rows = rawRows.map((row, index) => {
    if (index === 0) {
      return row
    }

    const nextRow = [...row]
    nextRow[ORDER_DATE_COLUMN_INDEX] = ''
    nextRow[WORK_HOURS_COLUMN_INDEX] = ''
    nextRow[POSITIVE_QUALIFIED_HOURS_COLUMN_INDEX] = ''
    nextRow[EXTRA_QUALIFIED_HOURS_COLUMN_INDEX] = ''
    nextRow[TOTAL_HOURS_COLUMN_INDEX] = ''
    nextRow[EFFICIENCY_COLUMN_INDEX] = ''
    nextRow[SHIFT_COLUMN_INDEX] = ''

    if (mergeRemark) {
      nextRow[REMARK_COLUMN_INDEX] = ''
    }

    return nextRow
  })

  const merges: NonNullable<XLSX.WorkSheet['!merges']> = []

  if (rows.length > 1) {
    const mergeStartRow = startRowIndex
    const mergeEndRow = startRowIndex + rows.length - 1

    merges.push(
      {
        s: { r: mergeStartRow, c: ORDER_DATE_COLUMN_INDEX },
        e: { r: mergeEndRow, c: ORDER_DATE_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: WORK_HOURS_COLUMN_INDEX },
        e: { r: mergeEndRow, c: WORK_HOURS_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: POSITIVE_QUALIFIED_HOURS_COLUMN_INDEX },
        e: { r: mergeEndRow, c: POSITIVE_QUALIFIED_HOURS_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: EXTRA_QUALIFIED_HOURS_COLUMN_INDEX },
        e: { r: mergeEndRow, c: EXTRA_QUALIFIED_HOURS_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: TOTAL_HOURS_COLUMN_INDEX },
        e: { r: mergeEndRow, c: TOTAL_HOURS_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: EFFICIENCY_COLUMN_INDEX },
        e: { r: mergeEndRow, c: EFFICIENCY_COLUMN_INDEX },
      },
      {
        s: { r: mergeStartRow, c: SHIFT_COLUMN_INDEX },
        e: { r: mergeEndRow, c: SHIFT_COLUMN_INDEX },
      },
    )

    if (mergeRemark) {
      merges.push({
        s: { r: mergeStartRow, c: REMARK_COLUMN_INDEX },
        e: { r: mergeEndRow, c: REMARK_COLUMN_INDEX },
      })
    }
  }

  return { rows, merges }
}

function sanitizeSheetName(name: string, index: number) {
  const normalized = (name || `员工${index + 1}`)
    .replace(/[\\/?*\[\]:]/g, ' ')
    .trim()

  return (normalized || `员工${index + 1}`).slice(0, 31)
}

function buildSummarySheetRows(
  employeeGroups: Array<[string, ProductionOrderForExport[]]>,
) {
  const rows: Array<Array<string | number | null | undefined>> = [
    [SUMMARY_TITLE],
    [...SUMMARY_HEADERS],
  ]

  employeeGroups.forEach(([employeeName, employeeOrders], index) => {
    const workHours = Number(
      employeeOrders
        .reduce((total, order) => total + normalizeNumber(order.work_hours), 0)
        .toFixed(2),
    )
    const positiveHours = Number(
      employeeOrders
        .reduce(
          (total, order) => total + getOrderPositiveQualifiedHours(order),
          0,
        )
        .toFixed(2),
    )
    const extraHours = Number(
      employeeOrders
        .reduce(
          (total, order) => total + normalizeNumber(order.extra_qualified_hours),
          0,
        )
        .toFixed(2),
    )
    const totalHours = Number(
      employeeOrders
        .reduce(
          (total, order) => total + normalizeNumber(order.total_qualified_hours),
          0,
        )
        .toFixed(2),
    )

    const row: SummaryRow = [
      index + 1,
      employeeName,
      workHours,
      positiveHours,
      extraHours,
      totalHours,
      0,
      0,
      0,
      '',
    ]

    rows.push(row)
  })

  return rows
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

function applySummarySheetStyles(
  worksheet: XLSX.WorkSheet,
  rows: Array<Array<string | number | null | undefined>>,
) {
  centerAllCells(worksheet, rows)
  setRowHeight(worksheet, 22, rows.length)
  worksheet['!rows'] = rows.map((_, index) => ({ hpt: index === 0 ? 26 : 22 }))
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
  ]

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: column })
      if (!worksheet[cellRef]) {
        continue
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
          sz: row === 0 ? 14 : 11,
          bold: row <= 1,
        },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      }

      if (row === 1) {
        worksheet[cellRef].s = {
          ...(worksheet[cellRef].s || {}),
          fill: {
            fgColor: { rgb: 'D9EAF7' },
          },
        }
      }
    }
  }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 2 }
}

export function exportProductionOrdersToExcel(
  orders: ProductionOrderForExport[],
) {
  const workbook = XLSX.utils.book_new()
  const employeeGroups = new Map<string, ProductionOrderForExport[]>()

  orders.forEach((order) => {
    const employeeName = order.employee?.name || '未分配员工'
    const employeeOrders = employeeGroups.get(employeeName) || []

    employeeOrders.push(order)
    employeeGroups.set(employeeName, employeeOrders)
  })

  const employeeGroupEntries = Array.from(employeeGroups.entries())
  const summaryRows = buildSummarySheetRows(employeeGroupEntries)
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryRows)

  summaryWorksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: SUMMARY_HEADERS.length - 1 },
    },
  ]

  applySummarySheetStyles(summaryWorksheet, summaryRows)
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, SUMMARY_SHEET_NAME)

  employeeGroupEntries.forEach(
    ([employeeName, employeeOrders], index) => {
      const sheetRows: Array<Array<string | number | null | undefined>> = [
        [...EXPORT_HEADERS],
      ]
      const merges: NonNullable<XLSX.WorkSheet['!merges']> = []

      employeeOrders.forEach((order) => {
        const { rows, merges: orderMerges } = buildOrderSheetRows(
          order,
          sheetRows.length,
        )

        sheetRows.push(...rows)
        merges.push(...orderMerges)
      })

      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)

      if (merges.length > 0) {
        worksheet['!merges'] = merges
      }

      for (let rowIndex = 1; rowIndex < sheetRows.length; rowIndex += 1) {
        const cellRef = XLSX.utils.encode_cell({
          r: rowIndex,
          c: TOTAL_HOURS_COLUMN_INDEX,
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
  ;(
    workbook as XLSX.WorkBook & { Workbook?: Record<string, unknown> }
  ).Workbook = {
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
