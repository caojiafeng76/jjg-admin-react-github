import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import {
  getQualityIssueOperatorName,
  getQualityIssueReporterName,
  QUALITY_ISSUE_AUDIT_STATUS_LABELS,
  type QualityIssueRecord,
} from '@/services/apiQualityIssueRecords'
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'

const SHEET_TITLE = '质量问题记录单'

const EXPORT_HEADERS = [
  '序号',
  '审核状态',
  '生产日期',
  '上报人',
  '项目号',
  '客户',
  '型号',
  '长度(mm)',
  '客户型号',
  '订单数量',
  '加工数量',
  '合格数量',
  '不良数量',
  '不良率(%)',
  '质量问题',
  '造成原因',
  '不良品处理结果',
  '问题类型',
  '责任处理结果',
  '操作人',
  '当班负责人',
  '检验人',
  '备注',
  '更新时间',
] as const

const EXPORT_COLUMN_WIDTHS = [
  8, 10, 12, 12, 14, 16, 14, 10, 18, 10, 10, 10, 10, 10, 26, 22, 22, 12, 22, 12,
  12, 10, 18, 20,
]

function formatDate(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD') : ''
}

function formatDateTime(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : ''
}

function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? '' : value
}

export function exportQualityIssueRecordsToExcel(
  records: QualityIssueRecord[],
) {
  const rows = records.map((record, index) => [
    index + 1,
    QUALITY_ISSUE_AUDIT_STATUS_LABELS[record.audit_status] ||
      record.audit_status,
    formatDate(record.production_date),
    getQualityIssueReporterName(record),
    record.project_no,
    record.customer || '',
    record.product_model || '',
    formatNumber(record.length_mm),
    record.customer_model || '',
    formatNumber(record.order_quantity),
    record.processed_quantity,
    record.qualified_quantity,
    record.defective_quantity,
    Number(record.defect_rate || 0).toFixed(2),
    record.quality_issue,
    record.cause,
    record.defective_handling_result,
    record.issue_type,
    record.responsibility_handling_result,
    getQualityIssueOperatorName(record),
    record.shift_leader_name,
    record.inspector_name,
    record.remark || '',
    formatDateTime(record.updated_at),
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

  XLSX.utils.book_append_sheet(workbook, worksheet, '质量问题记录')
  XLSX.writeFile(
    workbook,
    `质量问题记录_${records.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
