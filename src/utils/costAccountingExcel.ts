import * as XLSX from 'xlsx-js-style'

import type { StandardTime } from '@/services/apiStandardTimes'
import { EXCEL_WRITE_OPTIONS } from '@/utils/excelStyleUtils'

const EXPORT_TITLE = '精加工产品成本核算表'

const DETAIL_HEADERS = [
  '序号',
  '客户名',
  '工序',
  '型号',
  '长度',
  '料号',
  '标准工时\n（秒/支）',
  '人工费率',
  '人工成本系数',
  '人工成本\n（元/支）',
  '理论加工时间',
  '设备小时费率\n（折旧+电费）\n（元/H）',
  '设备成本\n（元/支）',
  '刀具损耗\n（元/支）',
  '切削液',
  '工装分摊',
  '刀具辅料成本',
  '检验工时',
  '检验成本\n（元/支）',
  '日管理\n总费用',
  '日总工时',
  '单品分摊额',
  '合计',
  '备注',
  '末道',
] as const

const GROUP_HEADER_ROW = [
  '序号',
  '客户名',
  '工序',
  '型号',
  '长度',
  '料号',
  '人工成本',
  '',
  '',
  '',
  '设备成本',
  '',
  '',
  '刀具/辅料/工装成本',
  '',
  '',
  '',
  '检验费用',
  '',
  '管理费用',
  '',
  '',
  '合计',
  '备注',
  '末道',
] as const

const COLUMN_WIDTHS = [
  8, 16, 18, 16, 10, 18, 12, 10, 10, 12, 12, 16, 12, 12, 10, 10, 13, 10, 12, 10,
  10, 12, 10, 18, 10,
]

const GROUP_FILL_BY_COLUMN: Record<number, string> = {
  6: 'FFF200',
  7: 'FFF200',
  8: 'FFF200',
  9: 'FFF200',
  10: 'F6B21A',
  11: 'F6B21A',
  12: 'F6B21A',
  13: '21B3E8',
  14: '21B3E8',
  15: '21B3E8',
  16: '21B3E8',
  17: 'E7E1F3',
  18: 'E7E1F3',
  19: '00B050',
  20: '00B050',
  21: '00B050',
}

const BORDER_STYLE = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
}

const TITLE_STYLE = {
  font: { name: '宋体', sz: 18, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

const HEADER_STYLE = {
  font: { name: '宋体', sz: 11, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

const BODY_STYLE = {
  font: { name: '宋体', sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

function formatNumber(value: number | null | undefined, digits = 4) {
  return Number(value || 0).toFixed(digits)
}

function formatMoney(value: number | null | undefined, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function setCellStyle(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
  style: Record<string, unknown>,
) {
  const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })

  if (!worksheet[cellRef]) {
    worksheet[cellRef] = {
      t: 's',
      v: '',
    }
  }

  worksheet[cellRef].s = style
}

function applyStyles(worksheet: XLSX.WorkSheet, rowCount: number) {
  for (let colIndex = 0; colIndex < DETAIL_HEADERS.length; colIndex += 1) {
    setCellStyle(worksheet, 0, colIndex, TITLE_STYLE)

    const headerFill = GROUP_FILL_BY_COLUMN[colIndex]
    setCellStyle(worksheet, 1, colIndex, {
      ...HEADER_STYLE,
      fill: headerFill
        ? { patternType: 'solid', fgColor: { rgb: headerFill } }
        : undefined,
      font:
        headerFill === '00B050'
          ? { ...HEADER_STYLE.font, color: { rgb: 'FFFFFF' } }
          : HEADER_STYLE.font,
    })

    setCellStyle(worksheet, 2, colIndex, {
      ...HEADER_STYLE,
      fill: headerFill
        ? { patternType: 'solid', fgColor: { rgb: headerFill } }
        : undefined,
      font:
        headerFill === '00B050'
          ? { ...HEADER_STYLE.font, color: { rgb: 'FFFFFF' } }
          : HEADER_STYLE.font,
    })
  }

  for (let rowIndex = 3; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < DETAIL_HEADERS.length; colIndex += 1) {
      setCellStyle(worksheet, rowIndex, colIndex, BODY_STYLE)
    }
  }
}

export function exportCostAccountingToExcel(records: StandardTime[]) {
  const rows = records.map((record, index) => [
    index + 1,
    record.customer || '',
    record.operation,
    record.model,
    formatNumber(record.length, 2),
    record.part_no || '',
    record.standard_seconds,
    formatNumber(record.labor_rate),
    formatNumber(record.labor_cost_coefficient),
    formatNumber(record.labor_cost),
    record.theoretical_seconds,
    formatNumber(record.equipment_rate),
    formatNumber(record.equipment_cost),
    formatNumber(record.tool_rate),
    formatNumber(record.cutting_fluid_rate),
    formatNumber(record.fixture_rate),
    formatNumber(record.tooling_consumable_cost),
    record.inspection_seconds,
    formatNumber(record.inspection_cost),
    formatMoney(record.daily_management_cost),
    formatNumber(record.daily_total_hours, 2),
    formatNumber(record.overhead_cost),
    formatNumber(record.total_cost),
    record.remark || '',
    record.is_last_process ? '是' : '否',
  ])

  const worksheetData = [
    [EXPORT_TITLE, ...Array(DETAIL_HEADERS.length - 1).fill('')],
    [...GROUP_HEADER_ROW],
    ['', '', '', '', '', '', ...DETAIL_HEADERS.slice(6)],
    ...rows,
  ]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: DETAIL_HEADERS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
    { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
    { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
    { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
    { s: { r: 1, c: 6 }, e: { r: 1, c: 9 } },
    { s: { r: 1, c: 10 }, e: { r: 1, c: 12 } },
    { s: { r: 1, c: 13 }, e: { r: 1, c: 16 } },
    { s: { r: 1, c: 17 }, e: { r: 1, c: 18 } },
    { s: { r: 1, c: 19 }, e: { r: 1, c: 21 } },
    { s: { r: 1, c: 22 }, e: { r: 2, c: 22 } },
    { s: { r: 1, c: 23 }, e: { r: 2, c: 23 } },
    { s: { r: 1, c: 24 }, e: { r: 2, c: 24 } },
  ]

  worksheet['!cols'] = COLUMN_WIDTHS.map((width) => ({ wch: width }))
  worksheet['!rows'] = [
    { hpt: 26, hpx: 26 },
    { hpt: 24, hpx: 24 },
    { hpt: 54, hpx: 54 },
    ...rows.map(() => ({ hpt: 22, hpx: 22 })),
  ]

  applyStyles(worksheet, worksheetData.length)

  XLSX.utils.book_append_sheet(workbook, worksheet, '成本核算')
  XLSX.writeFile(
    workbook,
    `成本核算导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
