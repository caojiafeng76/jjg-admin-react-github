import type { WorkshopOrderStatus } from './orderStatus'

export interface WorkshopOrder {
  id?: string
  order_date?: string | null
  product_delivery_date: string | null
  planned_start_date?: string | null
  planned_finish_date?: string | null
  closed_at?: string | null
  delivery_review_result?: string | null
  status?: WorkshopOrderStatus | null
  total_outbound_quantity?: number | null
  project_no: string | null
  product_model: string | null
  length_mm: number | null
  length_tolerance?: string | null
  process_flow?: string | null
  process_requirement?: string | null
  tooling_status?: string | null
  capacity_per_day?: number | null
  bottleneck_processes?: string | null
  material_status?: string | null
  order_category?: string | null
  delivery_priority?: string | null
  responsible_person?: string | null
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
  process_schedules?: WorkshopOrderProcessSchedule[] | null
  customer: string | null
  customer_model: string | null
  order_quantity: number | null
  weight_per_meter_kg: number | null
  color_name: string | null
  package_name: string | null
  product_category: string | null
  material_name: string | null
  material_code: string | null
  row_remark?: string | null
  sketch_file_path?: string | null
  sketch_file?: {
    fileName: string
    extension: string
    mimeType: string
    data: ArrayBuffer
  } | null
}

export type WorkshopOrderProcessScheduleStatus = '待排' | '已排' | '余排'

export interface WorkshopOrderProcessSchedule {
  id: string
  process_code: string
  process_name: string
  status: WorkshopOrderProcessScheduleStatus
  operator_id?: string | null
  operator_name?: string | null
  required_production_date: string | null
  scheduled_date: string | null
  last_scheduled_date: string | null
  scheduled_quantity: number | null
  remark?: string | null
}
