import type { ScannedProjectPayload } from './ProjectNoScanButton'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'

export type ActiveSheet = 'project' | 'operation' | 'machine' | null

export interface ProjectNoData {
  project_no: string
  product_model: string | null
  length_mm: number | null
  material_code?: string | null
  customer_model: string | null
}

export interface ScanPageLocationState {
  scannedProject?: ScannedProjectPayload
  returnTo?: string
  orderId?: string
  editingItem?: ProductionOrderItem
}

export function formatDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '未填写'
  }

  return String(value)
}
