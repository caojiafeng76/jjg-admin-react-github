import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'

type ExtrusionProductionItem =
  Database['public']['Tables']['extrusion_production_items']['Row']
type ExtrusionProductionRow =
  Database['public']['Tables']['extrusion_productions']['Row']

const EXTRUSION_PRODUCTION_DAILY_REPORT_EXPORT_PAGE_SIZE = 1000

export interface ExtrusionProductionDailyReportRow {
  id: string
  productionDate: string
  shift: string
  shiftLeaderName: string
  machineName: string
  unifiedDeviceNo: string
  projectNo: string
  productModel: string | null
  customer: string | null
  customerModel: string | null
  materialName: string | null
  orderLengthMm: number
  theoreticalUnitWeightKgPerMeter: number
  dieNo: string | null
  billetQuantity: number
  billetInputWeightKg: number
  actualOutputLengthMm: number
  actualUnitWeightKg: number
  actualQuantity: number
  theoreticalOutputCount: number
  theoreticalOutputWeightKg: number
  actualOutputWeightKg: number
  scrapWeightKg: number
  tailingWeightKg: number
  materialYield: number
  remark: string | null
  isAudited: boolean
}

export interface ExtrusionProductionDailyReportFilters {
  startDate?: string
  endDate?: string
  shift?: string
  machineId?: string
  projectNo?: string
  isAudited?: boolean
}

export interface ExtrusionProductionDailyReportResult {
  rows: ExtrusionProductionDailyReportRow[]
  total: number
}

type ProductionWithMachine = ExtrusionProductionRow & {
  machine: { machine_name: string; unified_device_no: string } | null
}

function buildRow(
  item: ExtrusionProductionItem,
  production: ProductionWithMachine,
): ExtrusionProductionDailyReportRow {
  return {
    id: item.id,
    productionDate: production.production_date,
    shift: production.shift,
    shiftLeaderName: production.shift_leader_name,
    machineName: production.machine?.machine_name || '',
    unifiedDeviceNo: production.machine?.unified_device_no || '',
    projectNo: item.project_no,
    productModel: item.product_model,
    customer: item.customer,
    customerModel: item.customer_model,
    materialName: item.material_name,
    orderLengthMm: item.order_length_mm,
    theoreticalUnitWeightKgPerMeter: item.theoretical_unit_weight_kg_per_meter,
    dieNo: item.die_no,
    billetQuantity: item.billet_quantity,
    billetInputWeightKg: item.billet_input_weight_kg,
    actualOutputLengthMm: item.actual_output_length_mm,
    actualUnitWeightKg: item.actual_unit_weight_kg,
    actualQuantity: item.actual_quantity,
    theoreticalOutputCount: item.theoretical_output_count,
    theoreticalOutputWeightKg: item.theoretical_output_weight_kg,
    actualOutputWeightKg: item.actual_output_weight_kg,
    scrapWeightKg: item.scrap_weight_kg,
    tailingWeightKg: item.tailing_weight_kg,
    materialYield: item.material_yield,
    remark: item.remark,
    isAudited: production.is_audited,
  }
}

export async function getExtrusionProductionDailyReport({
  page = 1,
  pageSize = 10,
  filters = {},
  signal,
}: {
  page?: number
  pageSize?: number
  filters?: ExtrusionProductionDailyReportFilters
  signal?: AbortSignal
}): Promise<ExtrusionProductionDailyReportResult> {
  let query = supabase.from('extrusion_production_items').select(
    `*,
      extrusion_productions!extrusion_production_items_extrusion_production_id_fkey!inner(
        *,
        machine:machine_equipment_maintenances!extrusion_productions_machine_id_fkey(machine_name, unified_device_no)
      )`,
    { count: 'exact' },
  )

  if (filters.startDate) {
    query = query.gte(
      'extrusion_productions.production_date',
      filters.startDate,
    )
  }

  if (filters.endDate) {
    query = query.lte('extrusion_productions.production_date', filters.endDate)
  }

  if (filters.shift) {
    query = query.eq('extrusion_productions.shift', filters.shift)
  }

  if (filters.machineId) {
    query = query.eq('extrusion_productions.machine_id', filters.machineId)
  }

  if (filters.projectNo) {
    query = query.ilike('project_no', `%${filters.projectNo.trim()}%`)
  }

  if (filters.isAudited !== undefined) {
    query = query.eq('extrusion_productions.is_audited', filters.isAudited)
  }

  query = query
    .order('extrusion_productions(production_date)', { ascending: false })
    .order('extrusion_productions(id)', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  const from = (page - 1) * pageSize
  const to = from + pageSize
  query = query.range(from, to - 1)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取挤压生产日报表失败')
  }

  const rows: ExtrusionProductionDailyReportRow[] = (data || []).map((item) => {
    const production =
      item.extrusion_productions as unknown as ProductionWithMachine
    return buildRow(item, production)
  })

  return {
    rows,
    total: count || 0,
  }
}

export async function getExtrusionProductionDailyReportForExport(
  filters?: ExtrusionProductionDailyReportFilters,
  signal?: AbortSignal,
): Promise<ExtrusionProductionDailyReportRow[]> {
  const rows: ExtrusionProductionDailyReportRow[] = []
  let from = 0

  while (true) {
    let query = supabase.from('extrusion_production_items').select(
      `*,
        extrusion_productions!extrusion_production_items_extrusion_production_id_fkey!inner(
          *,
          machine:machine_equipment_maintenances!extrusion_productions_machine_id_fkey(machine_name, unified_device_no)
        )`,
    )

    if (filters?.startDate) {
      query = query.gte(
        'extrusion_productions.production_date',
        filters.startDate,
      )
    }

    if (filters?.endDate) {
      query = query.lte(
        'extrusion_productions.production_date',
        filters.endDate,
      )
    }

    if (filters?.shift) {
      query = query.eq('extrusion_productions.shift', filters.shift)
    }

    if (filters?.machineId) {
      query = query.eq('extrusion_productions.machine_id', filters.machineId)
    }

    if (filters?.projectNo) {
      query = query.ilike('project_no', `%${filters.projectNo.trim()}%`)
    }

    if (filters?.isAudited !== undefined) {
      query = query.eq('extrusion_productions.is_audited', filters.isAudited)
    }

    query = query
      .order('extrusion_productions(production_date)', { ascending: false })
      .order('extrusion_productions(id)', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(
        from,
        from + EXTRUSION_PRODUCTION_DAILY_REPORT_EXPORT_PAGE_SIZE - 1,
      )

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取挤压生产日报表导出数据失败')
    }

    const pageItems = data || []
    rows.push(
      ...pageItems.map((item) => {
        const production =
          item.extrusion_productions as unknown as ProductionWithMachine
        return buildRow(item, production)
      }),
    )

    if (
      pageItems.length < EXTRUSION_PRODUCTION_DAILY_REPORT_EXPORT_PAGE_SIZE
    ) {
      break
    }

    from += EXTRUSION_PRODUCTION_DAILY_REPORT_EXPORT_PAGE_SIZE
  }

  return rows
}
