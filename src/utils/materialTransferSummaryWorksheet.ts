import * as XLSX from 'xlsx-js-style'

import type {
  MaterialTransferOrderProgress,
  MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { applyRegisterSheetStyles } from '@/utils/excelStyleUtils'

export const MATERIAL_TRANSFER_SUMMARY_SHEET_NAME = '汇总表'

const SUMMARY_TITLE_FALLBACK = '精加工车间订单物料转移、进度、状态汇总表'
const SUMMARY_HEADERS = [
  '创建时间',
  '项目号',
  '客户',
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
  '订单进度',
  '订单状态',
] as const

const SUMMARY_COLUMN_WIDTHS = [
  20, 14, 18, 9, 10, 28, 10, 14, 10, 8, 12, 8, 9, 10, 18, 16, 12, 10,
]

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('zh-CN')
}

function formatOrderProgressCell(
  progress: MaterialTransferOrderProgress | undefined,
): string {
  if (!progress || progress.completionRate == null) {
    return ''
  }

  return `${progress.completionRate.toFixed(1)}%`
}

function formatOrderStatusCell(
  progress: MaterialTransferOrderProgress | undefined,
): string {
  if (!progress || progress.orderQuantity == null) {
    return ''
  }

  return progress.isCompleted ? '完工' : '未完工'
}

function joinUniqueText(values: Array<string | null | undefined>): string {
  const uniqueValues = Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  return uniqueValues.join('、')
}

function getSummaryKey(record: MaterialTransferWithEmployee): string {
  return [
    record.project_no.trim(),
    record.customer?.trim() || '',
    record.product_model?.trim() || '',
    String(record.length_mm ?? ''),
    record.customer_model?.trim() || '',
    record.target_workshop.trim(),
  ].join('\u001F')
}

function groupRecordsByProductAndWorkshop(
  records: MaterialTransferWithEmployee[],
): MaterialTransferWithEmployee[][] {
  const groups = new Map<string, MaterialTransferWithEmployee[]>()

  for (const record of records) {
    const key = getSummaryKey(record)
    const group = groups.get(key)

    if (group) {
      group.push(record)
      continue
    }

    groups.set(key, [record])
  }

  return Array.from(groups.values())
}

function getSummaryTitle(records: MaterialTransferWithEmployee[]): string {
  const dates = new Set(
    records
      .map((record) => record.created_at.slice(0, 10))
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
  )

  if (dates.size !== 1) {
    return SUMMARY_TITLE_FALLBACK
  }

  const [date] = Array.from(dates)
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)

  if (!dateParts) {
    return SUMMARY_TITLE_FALLBACK
  }

  return `${Number(dateParts[2])}月${Number(dateParts[3])}日精加工车间订单物料转移、进度、状态汇总表`
}

function buildSummaryWorksheetData(
  records: MaterialTransferWithEmployee[],
  orderProgressMap: Map<string, MaterialTransferOrderProgress>,
): Array<Array<string | number>> {
  const summaryRows = groupRecordsByProductAndWorkshop(records).map((group) => {
    const representative = group[0]
    const progress = orderProgressMap.get(representative.project_no.trim())

    return [
      joinUniqueText(group.map((record) => formatDateTime(record.created_at))),
      representative.project_no,
      representative.customer || '',
      representative.product_model || '',
      representative.length_mm ?? '',
      representative.customer_model || '',
      group.reduce(
        (total, record) => total + Number(record.transfer_quantity || 0),
        0,
      ),
      joinUniqueText(group.flatMap((record) => record.operator_names)),
      representative.target_workshop,
      joinUniqueText(group.map((record) => record.recipient_name)),
      joinUniqueText(group.map((record) => record.shift_leader_name)),
      joinUniqueText(group.map((record) => record.inspector_name)),
      joinUniqueText(group.map((record) => record.uploaded_by_name)),
      joinUniqueText(
        group.map((record) => (record.is_audited ? '已审核' : '待审核')),
      ),
      joinUniqueText(group.map((record) => formatDateTime(record.audited_at))),
      joinUniqueText(group.map((record) => record.remark)),
      formatOrderProgressCell(progress),
      formatOrderStatusCell(progress),
    ]
  })

  return [
    [getSummaryTitle(records), ...SUMMARY_HEADERS.slice(1).map(() => '')],
    [...SUMMARY_HEADERS],
    ...summaryRows,
  ]
}

export function buildMaterialTransferSummaryWorksheet(
  records: MaterialTransferWithEmployee[],
  orderProgressMap: Map<string, MaterialTransferOrderProgress>,
): XLSX.WorkSheet {
  const worksheetData = buildSummaryWorksheetData(records, orderProgressMap)
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: SUMMARY_HEADERS.length - 1 } },
  ]
  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths: SUMMARY_COLUMN_WIDTHS,
  })

  return worksheet
}
