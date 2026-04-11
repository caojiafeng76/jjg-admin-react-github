import * as XLSX from 'xlsx-js-style'

import type { PrecisionCuttingTransferExportRow } from '@/services/apiPrecisionCuttingTransfers'
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'

const SHEET_TITLE = '精切转移单登记表'

const EXPORT_HEADERS = [
  '创建时间',
  '项目号',
  '客户',
  '型号',
  '长度(mm)',
  '客户型号',
  '长料长度(mm)',
  '长料数量',
  '原料不良数',
  '加工不良数',
  '外协不良数',
  '原料不良重量kg',
  '加工不良重量kg',
  '不良原因',
  '外协不良原因',
  '外协单位',
  '责任工序',
  '工序负责人',
  '转移数量',
  '操作人',
  '接收车间',
  '接收人',
  '检验人',
  '数据上传',
  '审核状态',
  '审核时间',
  '备注',
] as const

const EXPORT_COLUMN_WIDTHS = [
  20, 14, 18, 9, 10, 24, 12, 10, 10, 10, 10, 12, 12, 18, 18, 14, 14, 14,
  10, 14, 10, 8, 8, 9, 10, 18, 16,
]

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('zh-CN')
}

export function exportPrecisionCuttingTransfersToExcel(
  records: PrecisionCuttingTransferExportRow[],
) {
  const rows = records.map((record) => [
    formatDateTime(record.created_at),
    record.project_no,
    record.customer || '',
    record.product_model || '',
    record.length_mm ?? '',
    record.customer_model || '',
    record.long_material_length_mm,
    record.long_material_quantity,
    record.raw_material_defect_count,
    record.processing_defect_count,
    record.outsource_defect_quantity,
    record.raw_material_defect_weight_kg,
    record.processing_defect_weight_kg,
    record.defect_reason || '',
    record.outsource_defect_reason || '',
    record.outsource_unit || '',
    record.responsible_process || '',
    record.process_owner || '',
    record.transfer_quantity,
    record.operator_names.join('、'),
    record.target_workshop,
    record.recipient_name,
    record.inspector_name || '',
    record.uploaded_by_name || '',
    record.is_audited ? '已审核' : '待审核',
    formatDateTime(record.audited_at),
    record.remark || '',
  ])

  const worksheetData = [
    [SHEET_TITLE, ...EXPORT_HEADERS.slice(1).map(() => '')],
    EXPORT_HEADERS as unknown as Array<string | number>,
    ...rows,
  ]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: EXPORT_HEADERS.length - 1 },
    },
  ]

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths: EXPORT_COLUMN_WIDTHS,
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, '精切转移单')
  XLSX.writeFile(
    workbook,
    `精切转移单_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}