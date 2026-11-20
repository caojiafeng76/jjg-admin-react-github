import type { YoumaiRawMaterialInventory } from '@services/apiYoumaiRawMaterialInventory'

import * as XLSX from 'xlsx-js-style'
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'
import { formatDate, formatDateTime } from '@/utils/format'

const SHEET_TITLE = '优迈原料库存清单'

const EXPORT_HEADERS = ['型号', '规格', '库存数量', '预警状态', '更新时间']

function getWarningStatus(quantity: number): string {
  if (quantity < 50)
    return '红色预警'
  if (quantity < 100)
    return '黄色预警'
  return '正常'
}

export function exportYoumaiRawMaterialInventoryToExcel(
  records: YoumaiRawMaterialInventory[],
) {
  const dataRows = records.map(item => [
    item.model,
    item.specification,
    item.quantity,
    getWarningStatus(item.quantity),
    formatDateTime(item.updated_at),
  ])

  const worksheetData = [EXPORT_HEADERS, ...dataRows]

  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  applyRegisterSheetStyles(ws, worksheetData, {
    freezeYSplit: 1,
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_TITLE)

  const date = formatDate(new Date())
  XLSX.writeFile(wb, `优迈原料库存_${date}.xlsx`, EXCEL_WRITE_OPTIONS)
}
