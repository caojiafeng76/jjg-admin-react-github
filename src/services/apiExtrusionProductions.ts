import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import {
  calculateActualOutputWeight,
  calculateMaterialYield,
  calculateTheoreticalOutputWeight,
} from '@/utils/extrusionCalculations'
import type { Database } from './database.types'

type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row']
type SupabaseTableClient = ReturnType<typeof supabase.from>

export interface ExtrusionProductionItem {
  id: string
  extrusion_production_id: string
  sort_order: number
  project_no: string
  product_model: string | null
  customer: string | null
  customer_model: string | null
  material_name: string | null
  order_length_mm: number
  theoretical_unit_weight_kg_per_meter: number
  die_no: string | null
  billet_diameter_mm: number
  billet_length_mm: number
  billet_quantity: number
  billet_input_weight_kg: number
  actual_output_length_mm: number
  actual_unit_weight_kg: number
  actual_quantity: number
  theoretical_output_count: number
  theoretical_output_weight_kg: number
  actual_output_weight_kg: number
  scrap_weight_kg: number
  tailing_weight_kg: number
  material_yield: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface ExtrusionProduction {
  id: string
  production_date: string
  machine_id: string
  shift: string
  shift_leader_employee_id: string
  operator_employee_id: string
  inspector_employee_id: string | null
  uploaded_by_name: string | null
  remark: string | null
  is_audited: boolean
  audited_at: string | null
  created_at: string
  updated_at: string
  extrusion_production_items?: ExtrusionProductionItem[] | null
}

export interface ExtrusionProductionFilters {
  startDate?: string
  endDate?: string
  shift?: string
  machineId?: string
  operatorEmployeeId?: string
  projectNo?: string
  isAudited?: boolean
}

export interface ExtrusionProductionListResult {
  items: ExtrusionProduction[]
  total: number
}

export type ExtrusionSalesOrderDetail = Pick<
  SalesOrderRow,
  | 'project_no'
  | 'product_model'
  | 'length_mm'
  | 'material_code'
  | 'customer'
  | 'customer_model'
> & {
  project_no: string
}

export interface ExtrusionSalesOrderOption
  extends Pick<
    SalesOrderRow,
    | 'project_no'
    | 'product_model'
    | 'length_mm'
    | 'material_code'
    | 'customer'
    | 'customer_model'
    | 'created_at'
  > {
  project_no: string
}

export interface ExtrusionProductionHeaderInput {
  id?: string
  production_date: string
  machine_id: string
  shift: string
  shift_leader_employee_id: string
  operator_employee_id: string
  inspector_employee_id?: string | null
  uploaded_by_name?: string | null
  remark?: string | null
  is_audited?: boolean
  audited_at?: string | null
}

export interface ExtrusionProductionItemInput {
  id?: string
  sort_order?: number
  project_no: string
  product_model?: string | null
  customer?: string | null
  customer_model?: string | null
  material_name?: string | null
  order_length_mm: number
  theoretical_unit_weight_kg_per_meter: number
  die_no?: string | null
  billet_diameter_mm: number
  billet_length_mm: number
  billet_quantity: number
  billet_input_weight_kg: number
  actual_output_length_mm: number
  actual_unit_weight_kg: number
  actual_quantity: number
  theoretical_output_count: number
  theoretical_output_weight_kg?: number | null
  actual_output_weight_kg?: number | null
  scrap_weight_kg?: number | null
  tailing_weight_kg?: number | null
  material_yield?: number | null
  remark?: string | null
}

export interface UpsertExtrusionProductionPayload {
  header: ExtrusionProductionHeaderInput
  items: ExtrusionProductionItemInput[]
}

const EXTRUSION_PROJECT_OPTIONS_PAGE_SIZE = 1000

function extrusionProductionsTable(): SupabaseTableClient {
  return supabase.from('extrusion_productions' as never) as unknown as SupabaseTableClient
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeRequiredText(value: string, fieldLabel: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel}不能为空`)
  }

  return normalized
}

function normalizePositiveNumber(value: number, fieldLabel: string) {
  const normalized = Number(value)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`${fieldLabel}必须大于 0`)
  }

  return normalized
}

function normalizeNonNegativeInteger(value: number, fieldLabel: string) {
  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldLabel}必须为大于等于 0 的整数`)
  }

  return normalized
}

function normalizePositiveInteger(value: number, fieldLabel: string) {
  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${fieldLabel}必须为大于 0 的整数`)
  }

  return normalized
}

function normalizeExtrusionProductionHeader(
  header: ExtrusionProductionHeaderInput,
): ExtrusionProductionHeaderInput {
  return {
    id: header.id?.trim() || undefined,
    production_date: normalizeRequiredText(header.production_date, '生产日期'),
    machine_id: normalizeRequiredText(header.machine_id, '设备'),
    shift: normalizeRequiredText(header.shift, '班别'),
    shift_leader_employee_id: normalizeRequiredText(
      header.shift_leader_employee_id,
      '班组长',
    ),
    operator_employee_id: normalizeRequiredText(
      header.operator_employee_id,
      '操作人',
    ),
    inspector_employee_id: normalizeOptionalText(header.inspector_employee_id),
    uploaded_by_name: normalizeOptionalText(header.uploaded_by_name),
    remark: normalizeOptionalText(header.remark),
    is_audited: header.is_audited ?? false,
    audited_at: header.audited_at ?? null,
  }
}

function normalizeExtrusionProductionItem(
  item: ExtrusionProductionItemInput,
): ExtrusionProductionItemInput {
  const orderLengthMm = normalizePositiveNumber(item.order_length_mm, '订单长度')
  const theoreticalUnitWeightKgPerMeter = normalizePositiveNumber(
    item.theoretical_unit_weight_kg_per_meter,
    '理论米重',
  )
  const actualUnitWeightKg = normalizePositiveNumber(
    item.actual_unit_weight_kg,
    '实际支重',
  )
  const actualQuantity = normalizeNonNegativeInteger(item.actual_quantity, '实际数量')
  const theoreticalOutputCount = normalizeNonNegativeInteger(
    item.theoretical_output_count,
    '理论支数',
  )

  const theoreticalOutputWeightKg =
    item.theoretical_output_weight_kg ??
    calculateTheoreticalOutputWeight({
      orderLengthMm,
      theoreticalOutputCount,
      theoreticalUnitWeightKgPerMeter,
    })

  const actualOutputWeightKg =
    item.actual_output_weight_kg ??
    calculateActualOutputWeight({
      actualQuantity,
      actualUnitWeightKg,
    })

  const materialYield =
    item.material_yield ??
    calculateMaterialYield({
      actualOutputWeightKg,
      inputWeightKg: item.billet_input_weight_kg,
    })

  return {
    id: item.id?.trim() || undefined,
    sort_order: Number.isInteger(item.sort_order) ? item.sort_order : 0,
    project_no: normalizeRequiredText(item.project_no, '项目号'),
    product_model: normalizeOptionalText(item.product_model),
    customer: normalizeOptionalText(item.customer),
    customer_model: normalizeOptionalText(item.customer_model),
    material_name: normalizeOptionalText(item.material_name),
    order_length_mm: orderLengthMm,
    theoretical_unit_weight_kg_per_meter: theoreticalUnitWeightKgPerMeter,
    die_no: normalizeOptionalText(item.die_no),
    billet_diameter_mm: normalizePositiveNumber(item.billet_diameter_mm, '铝棒直径'),
    billet_length_mm: normalizePositiveNumber(item.billet_length_mm, '铝棒长度'),
    billet_quantity: normalizePositiveInteger(item.billet_quantity, '铝棒数量'),
    billet_input_weight_kg: normalizePositiveNumber(
      item.billet_input_weight_kg,
      '铝棒投入重量',
    ),
    actual_output_length_mm: normalizePositiveNumber(
      item.actual_output_length_mm,
      '实际产出长度',
    ),
    actual_unit_weight_kg: actualUnitWeightKg,
    actual_quantity: actualQuantity,
    theoretical_output_count: theoreticalOutputCount,
    theoretical_output_weight_kg: theoreticalOutputWeightKg,
    actual_output_weight_kg: actualOutputWeightKg,
    scrap_weight_kg: Number(item.scrap_weight_kg ?? 0),
    tailing_weight_kg: Number(item.tailing_weight_kg ?? 0),
    material_yield: materialYield,
    remark: normalizeOptionalText(item.remark),
  }
}

function applyExtrusionProductionFilters<
  TQuery extends {
    eq: (column: string, value: string | boolean) => TQuery
    gte: (column: string, value: string) => TQuery
    ilike: (column: string, value: string) => TQuery
    lt: (column: string, value: string) => TQuery
    or: (filters: string) => TQuery
  },
>(query: TQuery, filters: ExtrusionProductionFilters) {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte(
      'production_date',
      dayjs(filters.startDate).format('YYYY-MM-DD'),
    )
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lt(
      'production_date',
      dayjs(filters.endDate).add(1, 'day').format('YYYY-MM-DD'),
    )
  }

  if (filters.shift) {
    nextQuery = nextQuery.eq('shift', filters.shift)
  }

  if (filters.machineId) {
    nextQuery = nextQuery.eq('machine_id', filters.machineId)
  }

  if (filters.operatorEmployeeId) {
    nextQuery = nextQuery.eq('operator_employee_id', filters.operatorEmployeeId)
  }

  if (typeof filters.isAudited === 'boolean') {
    nextQuery = nextQuery.eq('is_audited', filters.isAudited)
  }

  if (filters.projectNo?.trim()) {
    nextQuery = nextQuery.or(
      `extrusion_production_items.project_no.ilike.%${filters.projectNo.trim()}%`,
    )
  }

  return nextQuery
}

export async function getExtrusionSalesOrdersProjectNos() {
  const allData: ExtrusionSalesOrderOption[] = []
  let fromIndex = 0

  while (true) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(
        'project_no, product_model, length_mm, material_code, customer, customer_model, created_at',
      )
      .eq('status', '生产中')
      .not('project_no', 'is', null)
      .order('created_at', { ascending: false })
      .order('project_no', { ascending: true })
      .range(fromIndex, fromIndex + EXTRUSION_PROJECT_OPTIONS_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取挤压项目号列表失败')
    }

    const filtered = (data || []).filter(
      (item): item is ExtrusionSalesOrderOption => item.project_no !== null,
    )
    allData.push(...filtered)

    if (!data || data.length < EXTRUSION_PROJECT_OPTIONS_PAGE_SIZE) {
      break
    }

    fromIndex += EXTRUSION_PROJECT_OPTIONS_PAGE_SIZE
  }

  return allData
}

export async function getExtrusionSalesOrderByProjectNo(projectNo: string) {
  const normalizedProjectNo = normalizeRequiredText(projectNo, '项目号')

  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, length_mm, material_code, customer, customer_model',
    )
    .eq('project_no', normalizedProjectNo)
    .single()

  if (error) {
    throw handleApiError(error, '获取挤压项目号详情失败')
  }

  if (!data?.project_no) {
    throw new Error('销售订单项目号不存在')
  }

  return data as ExtrusionSalesOrderDetail
}

export async function getExtrusionProductions({
  page,
  pageSize,
  filters = {},
}: {
  page: number
  pageSize: number
  filters?: ExtrusionProductionFilters
}): Promise<ExtrusionProductionListResult> {
  const fromIndex = (page - 1) * pageSize
  const toIndex = fromIndex + pageSize - 1

  let query = extrusionProductionsTable()
    .select('*, extrusion_production_items(*)', { count: 'exact' })
    .order('production_date', { ascending: false })
    .order('created_at', { ascending: false })

  query = applyExtrusionProductionFilters(query, filters)

  const { data, error, count } = await query.range(fromIndex, toIndex)

  if (error) {
    throw handleApiError(error, '获取挤压生产单列表失败')
  }

  return {
    items: (data || []) as unknown as ExtrusionProduction[],
    total: count || 0,
  }
}

export async function getExtrusionProductionById(id: string) {
  const { data, error } = await extrusionProductionsTable()
    .select('*, extrusion_production_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取挤压生产单详情失败')
  }

  return data as unknown as ExtrusionProduction
}

export async function createExtrusionProduction(
  payload: UpsertExtrusionProductionPayload,
) {
  const normalizedHeader = normalizeExtrusionProductionHeader(payload.header)
  const normalizedItems = payload.items.map(normalizeExtrusionProductionItem)

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)(
    'upsert_extrusion_production',
    {
      p_header: normalizedHeader,
      p_items: normalizedItems,
    },
  )

  if (error) {
    throw handleApiError(error, '创建挤压生产单失败')
  }

  return data as string
}

export async function updateExtrusionProduction({
  id,
  payload,
}: {
  id: string
  payload: UpsertExtrusionProductionPayload
}) {
  const normalizedHeader = normalizeExtrusionProductionHeader({
    ...payload.header,
    id,
  })
  const normalizedItems = payload.items.map(normalizeExtrusionProductionItem)

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)(
    'upsert_extrusion_production',
    {
      p_header: normalizedHeader,
      p_items: normalizedItems,
    },
  )

  if (error) {
    throw handleApiError(error, '更新挤压生产单失败')
  }

  return data as string
}

export async function deleteExtrusionProductions(ids: string[]) {
  if (ids.length === 0) {
    return
  }

  const { error } = await extrusionProductionsTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除挤压生产单失败')
  }
}
