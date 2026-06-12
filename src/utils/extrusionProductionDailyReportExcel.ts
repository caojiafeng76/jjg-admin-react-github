import * as XLSX from 'xlsx-js-style'

import type { ExtrusionProductionDailyReportRow } from '@/services/apiExtrusionProductionDailyReport'

const SHEET_TITLE = '挤压生产日报表'

const EXPORT_HEADERS = [
  '日期',
  '班次',
  '班组长',
  '设备名称',
  '设备编号',
  '项目号',
  '产品型号',
  '客户',
  '客户型号',
  '材料名称',
  '订单长度(mm)',
  '理论单重(kg/m)',
  '模具号',
  '铸锭数量',
  '铸锭投入重量(kg)',
  '实际产出长度(mm)',
  '实际单重(kg/m)',
  '实际数量',
  '理论产出数量',
  '理论产出重量(kg)',
  '实际产出重量(kg)',
  '废料重量(kg)',
  '尾料重量(kg)',
  '材料利用率(%)',
  '备注',
  '审核状态',
] as const

const EXPORT_COLUMN_WIDTHS = [
  12, 8, 12, 16, 14, 14, 12, 16, 12, 12, 14, 18, 10, 12, 18, 18, 18, 12, 14, 18, 18, 14, 14, 14, 20, 10,
]

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function formatNumber(value: unknown, decimals = 2): string {
  if (value === null || value === undefined) {
    return ''
  }
  const num = Number(value)
  if (isNaN(num)) {
    return ''
  }
  return decimals >= 0 ? num.toFixed(decimals) : String(num)
}

function formatPercentage(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  const num = Number(value)
  if (isNaN(num)) {
    return ''
  }
  return (num * 100).toFixed(2)
}

function applyHeaderStyle(
  worksheet: XLSX.WorkSheet,
  headerRowIndex: number,
  colCount: number,
) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || `A1:A1`)
  for (let col = range.s.c; col < colCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
    if (!worksheet[cellRef]) continue

    worksheet[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E0E0E0' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    }
  }
}

function applyDataStyles(
  worksheet: XLSX.WorkSheet,
  startRowIndex: number,
  colCount: number,
) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || `A1:A1`)
  for (let row = startRowIndex; row <= range.e.r; row++) {
    for (let col = range.s.c; col < colCount; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellRef]) continue

      worksheet[cellRef].s = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      }
    }
  }
}

export function getExtrusionProductionDailyReportExportFilename(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  return `挤压生产日报表_${dateStr}.xlsx`
}

export function exportExtrusionProductionDailyReportToExcel(
  rows: ExtrusionProductionDailyReportRow[],
): void {
  const dataRows = rows.map((row) => [
    row.productionDate,
    row.shift,
    row.shiftLeaderName,
    row.machineName,
    row.unifiedDeviceNo,
    row.projectNo,
    formatValue(row.productModel),
    formatValue(row.customer),
    formatValue(row.customerModel),
    formatValue(row.materialName),
    row.orderLengthMm,
    formatNumber(row.theoreticalUnitWeightKgPerMeter, 4),
    formatValue(row.dieNo),
    row.billetQuantity,
    formatNumber(row.billetInputWeightKg, 2),
    row.actualOutputLengthMm,
    formatNumber(row.actualUnitWeightKg, 4),
    row.actualQuantity,
    row.theoreticalOutputCount,
    formatNumber(row.theoreticalOutputWeightKg, 2),
    formatNumber(row.actualOutputWeightKg, 2),
    formatNumber(row.scrapWeightKg, 2),
    formatNumber(row.tailingWeightKg, 2),
    formatPercentage(row.materialYield),
    formatValue(row.remark),
    row.isAudited ? '已审核' : '待审核',
  ])

  const worksheetData = [
    [SHEET_TITLE, ...EXPORT_HEADERS.slice(1).map(() => '')],
    [...EXPORT_HEADERS],
    ...dataRows,
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Title merge
  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: EXPORT_HEADERS.length - 1 },
    },
  ]

  // Column widths
  worksheet['!cols'] = EXPORT_COLUMN_WIDTHS.map((w) => ({ wch: w }))

  // Apply styles
  applyHeaderStyle(worksheet, 1, EXPORT_HEADERS.length)
  applyDataStyles(worksheet, 2, EXPORT_HEADERS.length)

  // Title style
  const titleCell = worksheet['A1']
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, '挤压生产日报表')
  XLSX.writeFile(
    workbook,
    getExtrusionProductionDailyReportExportFilename(),
    { type: 'array' },
  )
}
