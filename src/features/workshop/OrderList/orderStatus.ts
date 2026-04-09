export type WorkshopOrderStatus = '生产中' | '已结案'

export const DEFAULT_WORKSHOP_ORDER_STATUS: WorkshopOrderStatus = '生产中'

export const WORKSHOP_ORDER_STATUS_OPTIONS = [
  { label: '生产中', value: '生产中' },
  { label: '已结案', value: '已结案' },
] as const

export function normalizeWorkshopOrderStatus(
  status?: WorkshopOrderStatus | null,
): WorkshopOrderStatus {
  return status === '已结案' ? '已结案' : DEFAULT_WORKSHOP_ORDER_STATUS
}

export function getWorkshopOrderStatusColor(
  status?: WorkshopOrderStatus | null,
) {
  return normalizeWorkshopOrderStatus(status) === '已结案'
    ? 'success'
    : 'processing'
}
