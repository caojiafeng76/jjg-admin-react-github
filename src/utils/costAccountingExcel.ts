import * as XLSX from 'xlsx-js-style'

import type { StandardTime } from '@/services/apiStandardTimes'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const EXPORT_HEADERS = [
  '型号',
  '工序',
  '工种',
  '标准工时(秒)',
  '理论工时(秒)',
  '检验工时(秒)',
  '人工费率(元/小时)',
  '设备费率(元/小时)',
  '刀具费率(元/支)',
  '切削液费率(元/支)',
  '工装费率(元/支)',
  '日管理总费用(元)',
  '日总工时(小时)',
  '人工成本(元/支)',
  '设备成本(元/支)',
  '刀具辅料成本(元/支)',
  '检验成本(元/支)',
  '单品分摊额(元/支)',
  '合计(元/支)',
  '备注',
  '更新时间',
] as const

function formatNumber(value: number | null | undefined, digits = 4) {
  return Number(value || 0).toFixed(digits)
}

function formatMoney(value: number | null | undefined, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('zh-CN')
}

export function exportCostAccountingToExcel(records: StandardTime[]) {
  const rows = records.map((record) => [
    record.model,
    record.operation,
    record.job_name || '',
    record.standard_seconds,
    record.theoretical_seconds,
    record.inspection_seconds,
    formatNumber(record.labor_rate),
    formatNumber(record.equipment_rate),
    formatNumber(record.tool_rate),
    formatNumber(record.cutting_fluid_rate),
    formatNumber(record.fixture_rate),
    formatMoney(record.daily_management_cost),
    formatNumber(record.daily_total_hours, 2),
    formatNumber(record.labor_cost),
    formatNumber(record.equipment_cost),
    formatNumber(record.tooling_consumable_cost),
    formatNumber(record.inspection_cost),
    formatNumber(record.overhead_cost),
    formatNumber(record.total_cost),
    record.remark || '',
    formatDateTime(record.updated_at),
  ])

  const worksheetData = [EXPORT_HEADERS as unknown as Array<string | number>, ...rows]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  centerAllCells(worksheet, worksheetData)
  setRowHeight(worksheet, 22, worksheetData.length)

  XLSX.utils.book_append_sheet(workbook, worksheet, '成本核算')
  XLSX.writeFile(
    workbook,
    `成本核算导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}