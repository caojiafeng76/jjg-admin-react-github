import * as XLSX from 'xlsx-js-style'

import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const EXPORT_HEADERS = [
  '项目号',
  '型号',
  '长度(mm)',
  '客户型号',
  '转移数量',
  '操作人',
  '接收车间',
  '接收人',
  '当班负责人',
  '检验人',
  '数据上传',
  '审核状态',
  '审核时间',
  '备注',
  '创建时间',
] as const

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('zh-CN')
}

export function exportMaterialTransfersToExcel(
  records: MaterialTransferWithEmployee[],
) {
  const rows = records.map((record) => [
    record.project_no,
    record.product_model || '',
    record.length_mm ?? '',
    record.customer_model || '',
    record.transfer_quantity,
    record.operator_names.join('、'),
    record.target_workshop,
    record.recipient_name,
    record.shift_leader_name || '',
    record.inspector_name || '',
    record.uploaded_by_name || '',
    record.is_audited ? '已审核' : '待审核',
    formatDateTime(record.audited_at),
    record.remark || '',
    formatDateTime(record.created_at),
  ])

  const worksheetData = [EXPORT_HEADERS as unknown as Array<string | number>, ...rows]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  centerAllCells(worksheet, worksheetData)
  setRowHeight(worksheet, 22, worksheetData.length)

  XLSX.utils.book_append_sheet(workbook, worksheet, '物料转移单')
  XLSX.writeFile(
    workbook,
    `物料转移单_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}