import * as XLSX from 'xlsx-js-style'

import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@utils/excelStyleUtils'
import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

function getColumnLetter(columnIndex: number) {
  let letter = ''
  let currentIndex = columnIndex

  while (currentIndex >= 0) {
    letter = String.fromCharCode((currentIndex % 26) + 65) + letter
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return letter
}

export function exportProductionDailyReportToExcel(
  rows: ProductionDailyReportRow[],
  operations: string[],
) {
  const lengthColumnIndex = 4
  const firstOperationColumnIndex = lengthColumnIndex + 1
  const rawMaterialDefectCountColumnIndex = firstOperationColumnIndex + operations.length
  const processingDefectCountColumnIndex = rawMaterialDefectCountColumnIndex + 1
  const rawMaterialDefectWeightColumnIndex = processingDefectCountColumnIndex + 1
  const processingDefectWeightColumnIndex = rawMaterialDefectWeightColumnIndex + 1

  const headers = [
    '日期',
    '工时',
    '项目号',
    '产品型号',
    '长度',
    ...operations,
    '原料不良数',
    '加工不良数',
    '原料不良重量kg',
    '加工不良重量kg',
    '操作人',
  ]

  const title = '精加工车间日产量汇总'

  const wsData = [
    [title, ...headers.slice(1).map(() => '')],
    headers,
    ...rows.map((row) => [
      row.orderDate,
      row.workHours,
      row.projectNo,
      row.productModel,
      row.lengthMm ?? '',
      ...operations.map((operation) => row.operationQuantities[operation] || 0),
      row.rawMaterialDefectCount,
      row.processingDefectCount,
      row.rawMaterialDefectWeightKg,
      row.processingDefectWeightKg,
      row.employeeName,
    ]),
  ]

  const firstDataRow = 3
  const lastDataRow = rows.length + 2
  const summaryRowIndex = wsData.length + 1
  const numericColumnIndexes = [
    1,
    ...operations.map((_operation, index) => firstOperationColumnIndex + index),
    rawMaterialDefectCountColumnIndex,
    processingDefectCountColumnIndex,
    rawMaterialDefectWeightColumnIndex,
    processingDefectWeightColumnIndex,
  ]

  const summaryRow = headers.map((_header, columnIndex) => {
    if (columnIndex === 0) {
      return '汇总'
    }

    return ''
  })

  wsData.push(summaryRow)

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(wsData)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: headers.length - 1 },
    },
  ]

  numericColumnIndexes.forEach((columnIndex) => {
    const columnLetter = getColumnLetter(columnIndex)
    const cellRef = XLSX.utils.encode_cell({
      r: summaryRowIndex - 1,
      c: columnIndex,
    })

    worksheet[cellRef] = {
      t: 'n',
      f: `SUM(${columnLetter}${firstDataRow}:${columnLetter}${lastDataRow})`,
      z:
        columnIndex === 1 ||
        columnIndex === rawMaterialDefectWeightColumnIndex ||
        columnIndex === processingDefectWeightColumnIndex
          ? '0.00'
          : '0',
      s: worksheet[cellRef]?.s,
    }
  })

  autoFitColumnWidths(worksheet, wsData)
  centerAllCells(worksheet, wsData)
  setRowHeight(worksheet, 22, wsData.length)

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (worksheet[titleCellRef]) {
    worksheet[titleCellRef].s = {
      ...(worksheet[titleCellRef].s || {}),
      font: {
        ...(worksheet[titleCellRef].s?.font || {}),
        bold: true,
        name: '宋体',
        sz: 14,
      },
      alignment: {
        ...(worksheet[titleCellRef].s?.alignment || {}),
        horizontal: 'center',
        vertical: 'center',
      },
      fill: {
        fgColor: { rgb: 'FFFFFF' },
      },
    }
  }

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: column })
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
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
  }

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cellRef = XLSX.utils.encode_cell({ r: summaryRowIndex - 1, c: column })
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          bold: true,
          name: '宋体',
          sz: 11,
        },
        fill: {
          fgColor: { rgb: 'FFF2CC' },
        },
        border: {
          top: { style: 'thin', color: { rgb: 'D6B656' } },
          bottom: { style: 'thin', color: { rgb: 'D6B656' } },
          left: { style: 'thin', color: { rgb: 'D6B656' } },
          right: { style: 'thin', color: { rgb: 'D6B656' } },
        },
      }
    }
  }

  if (!worksheet['!rows']) {
    worksheet['!rows'] = []
  }
  worksheet['!rows'][0] = { hpt: 28, hpx: 28 }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 2 }
  ;(workbook as XLSX.WorkBook & { Workbook?: Record<string, unknown> }).Workbook = {
    CalcPr: {
      calcMode: 'auto',
      fullCalcOnLoad: '1',
      forceFullCalc: '1',
    },
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, '生产日报表')
  XLSX.writeFile(
    workbook,
    `生产日报表_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}