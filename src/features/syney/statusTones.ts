import type { StatusTone } from '@/ui/StatusPill'

/** 西尼订单状态 → 徽章语义色（列表 / 详情共用） */
export const PO_STATUS_TONES: Record<string, StatusTone> = {
  已创建: 'danger',
  部分送货: 'info',
  已送货: 'info',
  已入库: 'success',
  暂停: 'warning',
  作废: 'neutral',
}

/** 西尼订单状态选项（用于表格筛选） */
export const PO_STATUSES = Object.keys(PO_STATUS_TONES)

/** 对账单校对状态：库里同时存在英文与中文两种取值 */
export const REPORT_STATUS_LABELS: Record<string, string> = {
  confirmed: '已校对',
  unconfirmed: '未校对',
  已校对: '已校对',
  未校对: '未校对',
}

export function getReportStatusTone(status: string | null | undefined): StatusTone {
  return REPORT_STATUS_LABELS[status ?? ''] === '已校对' ? 'success' : 'danger'
}
