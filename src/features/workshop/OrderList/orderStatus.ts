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

export function canWorkshopOrderBeClosed({
  status,
  orderQuantity,
  totalOutbound,
}: {
  status?: WorkshopOrderStatus | null
  orderQuantity?: number | null
  totalOutbound?: number | null
}) {
  const normalizedStatus = normalizeWorkshopOrderStatus(status)
  const normalizedOrderQuantity = orderQuantity ?? 0
  const normalizedTotalOutbound = totalOutbound ?? 0

  return (
    normalizedStatus === '生产中' &&
    normalizedOrderQuantity > 0 &&
    normalizedTotalOutbound >= normalizedOrderQuantity
  )
}

export function getWorkshopOrderStatusColor(
  status?: WorkshopOrderStatus | null,
) {
  return normalizeWorkshopOrderStatus(status) === '已结案'
    ? 'success'
    : 'processing'
}

/** 状态 pill 语义色（S2 体系：进行中=琥珀 / 完成=绿） */
export const WORKSHOP_ORDER_STATUS_PILL: Record<
  WorkshopOrderStatus,
  { bg: string; text: string; dot: string }
> = {
  生产中: {
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  已结案: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
}

export function getWorkshopOrderStatusPill(
  status?: WorkshopOrderStatus | null,
) {
  return WORKSHOP_ORDER_STATUS_PILL[normalizeWorkshopOrderStatus(status)]
}
