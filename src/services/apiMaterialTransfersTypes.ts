export const MATERIAL_TRANSFER_WORKSHOPS = [
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

export const MATERIAL_TRANSFER_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const MATERIAL_TRANSFER_RECIPIENTS = [
  '贾小勇',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
] as const

export type MaterialTransferWorkshop =
  (typeof MATERIAL_TRANSFER_WORKSHOPS)[number]

export interface MaterialTransferRow {
  audited_at: string | null
  created_at: string
  customer: string | null
  customer_model: string | null
  id: string
  inspector_name: string | null
  is_audited: boolean
  length_mm: number | null
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  product_model: string | null
  project_no: string
  recipient_name: string
  remark: string | null
  shift_leader_name: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at: string
  uploaded_by_name: string | null
}

export interface MaterialTransferInsertBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  product_model?: string | null
  project_no: string
  recipient_name: string
  remark?: string | null
  shift_leader_name?: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface MaterialTransferUpdateBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  operator_employee_id?: string
  operator_employee_ids?: string[]
  operator_names?: string[]
  product_model?: string | null
  project_no?: string
  recipient_name?: string
  remark?: string | null
  shift_leader_name?: string | null
  target_workshop?: string
  transfer_quantity?: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface MaterialTransferExtraFields {
  shift_leader_name: string | null
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface MaterialTransferAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type MaterialTransfer = MaterialTransferRow &
  MaterialTransferAuditFields &
  MaterialTransferExtraFields

export type MaterialTransferInsert = MaterialTransferInsertBase & {
  is_audited?: boolean
  audited_at?: string | null
} & Partial<MaterialTransferExtraFields>

export type MaterialTransferUpdate = MaterialTransferUpdateBase & {
  is_audited?: boolean
  audited_at?: string | null
} & Partial<MaterialTransferExtraFields>

export interface MaterialTransferWithEmployee extends MaterialTransfer {
  product_category?: string | null
  color_name?: string | null
  employee?: {
    id: string
    name: string
  } | null
}

export interface MaterialTransferFilters {
  startDate?: string
  endDate?: string
  projectNo?: string // 支持空格/逗号分隔的多关键词模糊搜索项目号
  productModel?: string // 支持空格/逗号分隔的多关键词模糊搜索型号
  materialCode?: string // 支持空格/逗号分隔的多关键词模糊搜索料号
  length_mm?: number[] // 多选长度
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface MaterialTransferQuantityStats {
  totalQuantity: number
  totalRecords: number
}

export interface TransferWorkshopStat {
  target_workshop: string
  total_quantity: number
  record_count: number
}

export interface ProjectTransferStats {
  byWorkshop: TransferWorkshopStat[]
  totalOutbound: number // 所有转移单的总数量（有记录即算出库）
  totalInWarehouse: number // 进入"仓库"的数量（入库量）
  totalTransferred: number // 所有车间转移总数（同 totalOutbound）
}

export interface MaterialTransferOrderProgress {
  transferTotal: number
  orderQuantity: number | null
  completionRate: number | null
  isCompleted: boolean
}
