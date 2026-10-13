import type { WorkshopOrder } from '@/features/workshop/OrderList'
import type { Database } from './database.types'

export type ProductionOrderItemRow = Pick<
  Database['public']['Tables']['production_order_items']['Row'],
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'data_category'
  | 'project_no'
  | 'product_model'
  | 'customer_model'
  | 'length_mm'
  | 'operation'
  | 'qualified_quantity'
  | 'qualified_hours'
  | 'incoming_qualified_quantity'
  | 'defect_quantity_1'
  | 'defect_quantity_2'
  | 'defect_reason_1'
  | 'defect_reason_2'
  | 'defect_hours'
  | 'outsource_defect_quantity'
  | 'outsource_defect_reason'
  | 'outsource_unit'
  | 'setup_defect_quantity'
  | 'setup_responsible'
  | 'standard_seconds'
  | 'theoretical_seconds'
  | 'remark'
  | 'order_id'
  | 'machine_equipment_id'
>

export type ProductionOrderRelation = {
  id: string
  order_date: string
  shift: string
  work_hours: number
  employee: { name: string } | null
}

export type MachineEquipmentRelation = {
  machine_name: string | null
  unified_device_no: string | null
}

export type ProductionOrderItemDetailRow = ProductionOrderItemRow & {
  machine_equipment_maintenances: MachineEquipmentRelation | null
  production_orders: ProductionOrderRelation | ProductionOrderRelation[] | null
}

export type ProcessStandardJobRow = Pick<
  Database['public']['Tables']['process_standards']['Row'],
  'job_name' | 'operation' | 'model' | 'length' | 'part_no' | 'record_type'
> & {
  is_last_process?: boolean | null
}

export type PackagingDashboardWorkOrderRow = {
  id: string
  work_date: string
  employee_name?: string | null
  project_no: string | null
  product_model: string | null
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  weight_per_meter_kg?: number | null
  quantity: number | null
  defective_quantity?: number | null
  defective_weight_kg?: number | null
  defect_reason?: string | null
  standard_seconds: number | null
  work_hours: number | null
  extra_qualified_hours?: number | null
  remark: string | null
}

export type PackagingWorkOrderQueryRow = PackagingDashboardWorkOrderRow & {
  packaging_employees?: { name?: string | null } | null
}

export type OrderStatusDashboardRpcItem = WorkshopOrder & {
  id: string
  completionRate: number | null
  finishedQuantity: number
  latestTransferAt: string | null
  latestTransferOperatorNames: string[] | string | null
  latestTransferWorkshop: string | null
  precisionCuttingDetails: OrderStatusPrecisionCuttingTransferDetail[] | null
  precisionCuttingQuantity: number
  extrusionDetails: OrderStatusExtrusionDetail[] | null
  extrusionQuantity: number
  productionRows: ProductionOrderItemDetailRow[] | null
  productionStatus: OrderProductionStatus
  totalDefectQuantity: number
  totalIncomingQuantity: number
  totalQualifiedQuantity: number
  transferDetails: OrderStatusMaterialTransferDetail[] | null
  transferQuantity: number
  transferRecordCount: number
  transferWorkshops: string[] | null
  warehouseTransferQuantity: number
  yieldRate: number | null
  reworkRepairRows:
    | {
        workflow_status: string
        quantity: number
      }[]
    | null
}

export interface OrderStatusDashboardRpcResult {
  items?: OrderStatusDashboardRpcItem[]
  kpis?: Partial<OrderStatusDashboardKpis>
  materialTransferCount?: number
  productionItemCount?: number
  total?: number
}

export interface OrderStatusMaterialTransferDetail {
  createdAt: string
  isAudited: boolean
  operatorNames: string[]
  recipientName: string
  targetWorkshop: string
  transferQuantity: number
}

export interface OrderStatusPrecisionCuttingTransferDetail {
  createdAt: string
  defectReason: string | null
  id: string
  isAudited: boolean
  lengthMm: number | null
  longMaterialLengthMm: number
  longMaterialQuantity: number
  operatorNames: string[]
  outsourceDefectQuantity: number
  outsourceDefectReason: string | null
  outsourceUnit: string | null
  processOwner: string | null
  processingDefectCount: number
  rawMaterialDefectCount: number
  recipientName: string
  remark: string | null
  responsibleProcess: string | null
  targetWorkshop: string
  transferQuantity: number
}

export interface OrderStatusExtrusionDetail {
  createdAt: string
  productionDate: string
  shift: string
  shiftLeaderName: string
  isAudited: boolean
  actualOutputLengthMm: number | null
  orderLengthMm: number | null
  actualQuantity: number
  theoreticalOutputCount: number
  actualOutputWeightKg: number
  materialYield: number
}

export interface OrderStatusProductionDetail {
  id: string
  createdAt: string
  updatedAt: string
  dataCategory: string
  projectNo: string
  productModel: string | null
  customerModel: string | null
  lengthMm: number | null
  operation: string
  orderId: string
  orderDate: string
  shift: string
  operatorName: string | null
  workHours: number
  machineEquipmentId: string | null
  machineName: string | null
  unifiedDeviceNo: string | null
  jobName: string
  incomingQualifiedQuantity: number
  qualifiedQuantity: number
  qualifiedHours: number | null
  defectQuantity: number
  defectQuantity1: number
  defectQuantity2: number
  defectReason1: string | null
  defectReason2: string | null
  defectHours: number | null
  outsourceDefectQuantity: number
  outsourceDefectReason: string | null
  outsourceUnit: string | null
  setupDefectQuantity: number
  setupResponsible: string | null
  standardSeconds: number
  theoreticalSeconds: number
  remark: string | null
}

export type OrderProductionStatus = '正常' | '预警' | '延期'

export interface ReworkRepairInfo {
  totalQuantity: number
  pendingWorkshopCount: number
  pendingProductionCount: number
  pendingTechnicalCount: number
  pendingQualityCount: number
  completedCount: number
}

export const REWORK_REPAIR_STATUS_COLORS: Record<
  keyof Omit<ReworkRepairInfo, 'totalQuantity'>,
  string
> = {
  pendingWorkshopCount: 'default',
  pendingProductionCount: 'processing',
  pendingTechnicalCount: 'warning',
  pendingQualityCount: 'orange',
  completedCount: 'success',
}

export const REWORK_REPAIR_STATUS_LABELS: Record<
  keyof Omit<ReworkRepairInfo, 'totalQuantity'>,
  string
> = {
  pendingWorkshopCount: '待车间发起',
  pendingProductionCount: '待生产部确认',
  pendingTechnicalCount: '待技术部确认',
  pendingQualityCount: '待质量部确认',
  completedCount: '已完成',
}

export interface OrderStatusJobColumn {
  key: string
  title: string
  operations: string[]
}

export interface OrderStatusDashboardItem extends WorkshopOrder {
  id: string
  jobOutputs: Record<string, number>
  productionDetails: OrderStatusProductionDetail[]
  totalIncomingQuantity: number
  totalQualifiedQuantity: number
  totalDefectQuantity: number
  precisionCuttingQuantity: number
  precisionCuttingDetails: OrderStatusPrecisionCuttingTransferDetail[]
  extrusionQuantity: number
  extrusionDetails: OrderStatusExtrusionDetail[]
  transferQuantity: number
  warehouseTransferQuantity: number
  transferRecordCount: number
  transferWorkshops: string[]
  latestTransferWorkshop: string | null
  latestTransferAt: string | null
  latestTransferOperatorNames: string[]
  transferDetails: OrderStatusMaterialTransferDetail[]
  finishedQuantity: number
  completionRate: number | null
  yieldRate: number | null
  productionStatus: OrderProductionStatus
  reworkRepairInfo: ReworkRepairInfo
}

/**
 * 订单现状看板全局 KPI（在 RPC 的完整筛选集上聚合，非当前分页切片）。
 * - 状态分布 / 平均完工率 / 平均成品率 / 明细数 / 转移数均随筛选条件联动。
 * - avgCompletionRate / avgYieldRate 为 0-100 百分数。
 */
export interface OrderStatusDashboardKpis {
  totalOrderCount: number
  normalOrderCount: number
  warningOrderCount: number
  overdueOrderCount: number
  avgCompletionRate: number
  avgYieldRate: number
  productionItemCount: number
  materialTransferCount: number
}

export const EMPTY_ORDER_STATUS_DASHBOARD_KPIS: OrderStatusDashboardKpis = {
  totalOrderCount: 0,
  normalOrderCount: 0,
  warningOrderCount: 0,
  overdueOrderCount: 0,
  avgCompletionRate: 0,
  avgYieldRate: 0,
  productionItemCount: 0,
  materialTransferCount: 0,
}

export interface OrderStatusDashboardResult {
  items: OrderStatusDashboardItem[]
  total: number
  jobColumns: OrderStatusJobColumn[]
  productionItemCount: number
  materialTransferCount: number
  kpis: OrderStatusDashboardKpis
}

export interface OrderStatusDashboardFilters {
  customer?: string
  materialCode?: string
  model?: string
  orderDate?: string
  productionStatus?: OrderProductionStatus
  projectNo?: string
  status?: WorkshopOrder['status']
}
