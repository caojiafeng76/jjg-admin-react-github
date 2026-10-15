import type {
  WorkshopOrder,
  WorkshopOrderProcessSchedule,
} from '@/features/workshop/OrderList'
import type { Database } from './database.types'

export type ProcessStandardCapacityRow = Pick<
  Database['public']['Tables']['process_standards']['Row'],
  | 'length'
  | 'model'
  | 'operation'
  | 'part_no'
  | 'record_type'
  | 'standard_seconds'
>

export interface SchedulingProcessDefinition {
  code: string
  name: string
}

export interface ProductionSchedulingFilters {
  customer?: string
  lengthMm?: number[]
  materialCode?: string
  model?: string
  projectNo?: string
  status?: WorkshopOrder['status'] | '全部'
  progressStatus?: string
  plannedStartDateFrom?: string
  plannedStartDateTo?: string
  orderDateFrom?: string
  orderDateTo?: string
}

export interface ProductionSchedulingOrdersResult {
  orders: ProductionSchedulingOrder[]
  total: number
}

export interface ProductionSchedulingOrder extends WorkshopOrder {
  responsible_person?: string | null
  responsible_person_ids?: string[] | null
  responsible_person_names?: string[] | null
  progress_status?: string | null
  progress_percent?: number | null
  processed_quantity: number
  scheduled_quantity: number
  scheduled_rate: number
  total_pending_quantity: number
  transfer_latest_date: string | null
  transfer_latest_workshop: string | null
  transfer_quantity: number
  transfer_record_count: number
  transfer_rate: number
  remaining_schedule_quantity: number
  remaining_schedule_rate: number
  processed_rate: number
  /** 库存 = 精切转入 + 自动切合格 - 各工序报废 - 转移出去 */
  inventory_quantity: number
  inventory_precision_cutting_quantity: number
  inventory_auto_cut_quantity: number
  inventory_defect_quantity: number
}

export interface InventoryQuantityInput {
  autoCutQuantity: number
  defectQuantity: number
  precisionCuttingQuantity: number
  transferQuantity: number
}

export interface ProductionSchedulingProcessRow {
  key: string
  order: ProductionSchedulingOrder
  schedule: WorkshopOrderProcessSchedule
}

export interface ProductionSchedulingOrderUpdate {
  order_date?: string | null
  product_delivery_date?: string | null
  planned_start_date?: string | null
  planned_finish_date?: string | null
  delivery_review_result?: string | null
  process_flow?: string | null
  process_requirement?: string | null
  tooling_status?: string | null
  capacity_per_day?: number | null
  bottleneck_processes?: string | null
  material_status?: string | null
  order_category?: string | null
  delivery_priority?: string | null
  responsible_person?: string | null
  responsible_person_ids?: string[] | null
  responsible_person_names?: string[] | null
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
  process_schedules?: WorkshopOrderProcessSchedule[] | null
}

export const PRODUCTION_SCHEDULING_PROCESS_OPTIONS: SchedulingProcessDefinition[] =
  [
    { code: '①', name: '精切' },
    { code: '②', name: '切割' },
    { code: '③', name: 'CNC' },
    { code: '④', name: '冲床' },
    { code: '⑤', name: '钻床' },
    { code: '⑥', name: '端铣' },
    { code: '⑦', name: '攻丝' },
    { code: '⑧', name: '滚弯' },
    { code: '⑨', name: '折弯' },
    { code: '⑩', name: '塑封' },
    { code: '⑪', name: '去毛刺' },
    { code: '⑫', name: '预留工序' },
    { code: '⑬', name: '整形' },
    { code: '⑭', name: '检验' },
    { code: '⑮', name: '焊接' },
    { code: '⑯', name: '组装' },
  ]
