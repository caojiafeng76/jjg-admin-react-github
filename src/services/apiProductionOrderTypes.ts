import type { Database } from './database.types'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from './apiProductionOrderItems'

export type ProductionOrderShift = '白班' | '夜班'

export type ProductionOrder =
  Database['public']['Tables']['production_orders']['Row'] & {
    shift: ProductionOrderShift
  }
export type ProductionOrderInsert =
  Database['public']['Tables']['production_orders']['Insert'] & {
    shift?: ProductionOrderShift
  }
export type ProductionOrderUpdate =
  Database['public']['Tables']['production_orders']['Update'] & {
    shift?: ProductionOrderShift
  }

export interface ProductionOrderWithEmployee extends ProductionOrder {
  employee?: {
    id: string
    name: string
    job_name?: string | null
    hourly_wage?: number | null
    coefficient?: number | null
    is_external?: boolean | null
  }
}

export interface ProductionOrderListItem extends ProductionOrderWithEmployee {
  hasZeroStandardQualifiedItem?: boolean
  positive_qualified_hours?: number
}

export interface ProductionOrderForExport extends ProductionOrderWithEmployee {
  items: ProductionOrderItem[]
}

export interface ProductionOrderFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  shift?: ProductionOrderShift
  dataCategory?: ProductionOrderDataCategory
  productModel?: string
  customerModel?: string
  isAudited?: boolean
}

export interface ProductionOrderExportProgress {
  loaded: number
  total: number
}

export interface ProductionItemWithOrderDetail {
  id: string
  operation: string
  project_no: string
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
  qualified_quantity: number
  incoming_qualified_quantity: number
  defect_quantity_1: number
  defect_quantity_2: number
  defect_reason_1: string | null
  defect_reason_2: string | null
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
  standard_seconds: number
  remark: string | null
  order_id: string
  order_date: string
  shift: string
  employee_name: string | null
}
