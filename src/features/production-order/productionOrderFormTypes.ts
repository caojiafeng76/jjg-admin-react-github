import type { ProductionOrder } from '@/services/apiProductionOrders'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from '@/services/apiProductionOrderItems'
import type { ProcessStandardMatchLevel } from './useProcessStandards'

export type ProductionOrderFormInitialValues = ProductionOrder & {
  items?: ProductionOrderItem[]
}

export interface ProductionOrderFormProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: {
    order: Partial<ProductionOrder>
    items: OrderItem[]
  }) => Promise<void> | void
  initialValues?: ProductionOrderFormInitialValues
  employees: { id: string; name: string }[]
  fixedEmployee?: { id: string; name: string } | null
  loading?: boolean
  compact?: boolean
  showAuditField?: boolean
}

export interface OrderItem {
  id?: string
  data_category?: ProductionOrderDataCategory
  project_no: string
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
  operation: string
  standard_seconds: number
  theoretical_seconds?: number
  machine_equipment_id?: string | null
  incoming_qualified_quantity: number
  qualified_quantity: number
  defect_reason_1: string | null
  defect_quantity_1: number
  defect_reason_2: string | null
  defect_quantity_2: number
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
  remark?: string | null
}

export interface ProjectNoData {
  product_model: string | null
  length_mm: number | null
  material_code: string | null
  customer_model: string | null
}

export const MATCH_LEVEL_LABELS: Record<ProcessStandardMatchLevel, string> = {
  'type-a': 'A类（料号+型号+长度）',
  'type-b': 'B类（仅型号）',
}

export const MATCH_LEVEL_COLORS: Record<ProcessStandardMatchLevel, string> = {
  'type-a': 'success',
  'type-b': 'processing',
}

export const ITEM_FORM_INITIAL_VALUES = {
  incoming_qualified_quantity: 0,
  qualified_quantity: 0,
  defect_quantity_1: 0,
  defect_quantity_2: 0,
  outsource_defect_quantity: 0,
  outsource_defect_reason: null,
  outsource_unit: null,
  setup_defect_quantity: 0,
  setup_responsible: null,
  remark: null,
}
