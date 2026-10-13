import type { ProductionOrder } from '@/services/apiProductionOrders'

export type UnlockManagementFormValues = {
  password: string
}

export type ChangeManagementPasswordFormValues = {
  currentPassword: string
  nextPassword: string
  confirmPassword: string
}

export function isAuditedRecord(
  record?: Partial<ProductionOrder> & { is_audited?: boolean },
) {
  return Boolean(record?.is_audited)
}
