export const PRECISION_CUTTING_TRANSFER_WORKSHOPS = [
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

export const PRECISION_CUTTING_TRANSFER_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const PRECISION_CUTTING_TRANSFER_RECIPIENTS = [
  '贾小勇',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
  '周弘凯',
  '沈佳伟',
  '张宏',
] as const

export const PRECISION_CUTTING_TRANSFER_OPERATORS = [
  '吴国忠',
  '蒋建祥',
  '姚利祥',
] as const

export type PrecisionCuttingTransferWorkshop =
  (typeof PRECISION_CUTTING_TRANSFER_WORKSHOPS)[number]

export interface PrecisionCuttingTransferRow {
  audited_at: string | null
  created_at: string
  customer: string | null
  customer_model: string | null
  data_error_responsible: string | null
  defect_reason: string | null
  id: string
  inspector_name: string | null
  is_audited: boolean
  length_mm: number | null
  long_material_length_mm: number
  long_material_quantity: number
  process_card_long_material_quantity: number | null
  erp_long_material_quantity: number | null
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

export interface PrecisionCuttingTransferInsertBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  data_error_responsible?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm: number
  long_material_quantity: number
  process_card_long_material_quantity?: number | null
  erp_long_material_quantity?: number | null
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

export interface PrecisionCuttingTransferUpdateBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  data_error_responsible?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm?: number
  long_material_quantity?: number
  process_card_long_material_quantity?: number | null
  erp_long_material_quantity?: number | null
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

export interface PrecisionCuttingTransferExtraFields {
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface PrecisionCuttingTransferAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type PrecisionCuttingTransfer = PrecisionCuttingTransferRow &
  PrecisionCuttingTransferAuditFields &
  PrecisionCuttingTransferExtraFields

export type PrecisionCuttingTransferInsert =
  PrecisionCuttingTransferInsertBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionCuttingTransferExtraFields>

export type PrecisionCuttingTransferUpdate =
  PrecisionCuttingTransferUpdateBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionCuttingTransferExtraFields>

export interface PrecisionCuttingTransferFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  operatorName?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface PrecisionCuttingTransferQuantityStats {
  totalQuantity: number
  totalRecords: number
}

export interface PrecisionCuttingTransferExportRow extends PrecisionCuttingTransferRow {
  processing_defect_weight_kg: number
  raw_material_defect_weight_kg: number
}
