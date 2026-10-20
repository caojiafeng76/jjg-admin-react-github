export const PRECISION_FINISHING_CUTTING_WORKSHOPS = [
  '挤压',
  '时效',
  '大氧化',
  '小氧化',
  '精切',
  '精加工',
  '喷涂',
  '抛光',
  '包装',
  '仓库',
] as const

export const PRECISION_FINISHING_CUTTING_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const PRECISION_FINISHING_CUTTING_RECIPIENTS = [
  '贾小勇',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
] as const

export type PrecisionFinishingCuttingWorkshop
  = (typeof PRECISION_FINISHING_CUTTING_WORKSHOPS)[number]

export interface PrecisionFinishingCuttingRow {
  audited_at: string | null
  created_at: string
  customer: string | null
  customer_model: string | null
  defect_reason: string | null
  id: string
  inspector_name: string | null
  is_audited: boolean
  length_mm: number | null
  long_material_length_mm: number
  long_material_quantity: number
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  process_owner: string | null
  product_model: string | null
  project_no: string
  processing_defect_count: number
  raw_material_defect_count: number
  recipient_name: string
  remark: string | null
  responsible_process: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at: string
  uploaded_by_name: string | null
}

export interface PrecisionFinishingCuttingInsertBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm: number
  long_material_quantity: number
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  outsource_defect_quantity?: number
  outsource_defect_reason?: string | null
  outsource_unit?: string | null
  process_owner?: string | null
  product_model?: string | null
  project_no: string
  processing_defect_count: number
  raw_material_defect_count: number
  recipient_name: string
  remark?: string | null
  responsible_process?: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface PrecisionFinishingCuttingUpdateBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm?: number
  long_material_quantity?: number
  operator_employee_id?: string
  operator_employee_ids?: string[]
  operator_names?: string[]
  outsource_defect_quantity?: number
  outsource_defect_reason?: string | null
  outsource_unit?: string | null
  process_owner?: string | null
  product_model?: string | null
  project_no?: string
  processing_defect_count?: number
  raw_material_defect_count?: number
  recipient_name?: string
  remark?: string | null
  responsible_process?: string | null
  target_workshop?: string
  transfer_quantity?: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface PrecisionFinishingCuttingExtraFields {
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface PrecisionFinishingCuttingAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type PrecisionFinishingCutting = PrecisionFinishingCuttingRow
  & PrecisionFinishingCuttingAuditFields
  & PrecisionFinishingCuttingExtraFields

export type PrecisionFinishingCuttingInsert
  = PrecisionFinishingCuttingInsertBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionFinishingCuttingExtraFields>

export type PrecisionFinishingCuttingUpdate
  = PrecisionFinishingCuttingUpdateBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionFinishingCuttingExtraFields>

export interface PrecisionFinishingCuttingWithEmployee
  extends PrecisionFinishingCutting {
  employee?: {
    id: string
    name: string
  } | null
}

export interface PrecisionFinishingCuttingFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface PrecisionFinishingCuttingQuantityStats {
  totalQuantity: number
  totalRecords: number
}

export interface PrecisionFinishingCuttingExportRow
  extends PrecisionFinishingCuttingRow {
  processing_defect_weight_kg: number
  raw_material_defect_weight_kg: number
}
