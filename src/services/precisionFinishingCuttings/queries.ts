import type {
  PrecisionFinishingCuttingExportRow,
  PrecisionFinishingCuttingFilters,
  PrecisionFinishingCuttingQuantityStats,
  PrecisionFinishingCuttingRow,
  PrecisionFinishingCuttingWithEmployee,
} from './types'
import dayjs from 'dayjs'

import { handleApiError } from '@/utils/errorHandler'
import supabase from '../supabase'
import { chunkArray, roundTo } from './normalize'

const PRECISION_FINISHING_CUTTINGS_TABLE = 'precision_finishing_cuttings'

const EXPORT_PAGE_SIZE = 1000

export function getPrecisionFinishingCuttingsQuery() {
  return supabase.from(PRECISION_FINISHING_CUTTINGS_TABLE)
}

function applyPrecisionFinishingCuttingFilters<
  TQuery extends {
    ilike: (column: string, pattern: string) => TQuery
    contains: (column: string, value: string[]) => TQuery
    eq: (column: string, value: string | boolean) => TQuery
    gte: (column: string, value: string) => TQuery
    lt: (column: string, value: string) => TQuery
  },
>(query: TQuery, filters: PrecisionFinishingCuttingFilters) {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte(
      'created_at',
      dayjs(filters.startDate).startOf('day').toISOString(),
    )
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lt(
      'created_at',
      dayjs(filters.endDate).add(1, 'day').startOf('day').toISOString(),
    )
  }

  if (filters.projectNo) {
    nextQuery = nextQuery.ilike('project_no', `%${filters.projectNo}%`)
  }

  if (filters.productModel) {
    nextQuery = nextQuery.ilike('product_model', `%${filters.productModel}%`)
  }

  if (filters.employeeId) {
    nextQuery = nextQuery.contains('operator_employee_ids', [filters.employeeId])
  }

  if (filters.targetWorkshop) {
    nextQuery = nextQuery.eq('target_workshop', filters.targetWorkshop)
  }

  if (filters.recipientName) {
    nextQuery = nextQuery.ilike('recipient_name', `%${filters.recipientName}%`)
  }

  if (typeof filters.isAudited === 'boolean') {
    nextQuery = nextQuery.eq('is_audited', filters.isAudited)
  }

  return nextQuery
}

async function getProjectWeightMap(projectNos: string[]) {
  const weightMap = new Map<string, number>()
  const uniqueProjectNos = Array.from(new Set(projectNos.filter(Boolean)))

  for (const chunk of chunkArray(uniqueProjectNos, 1000)) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, weight_per_meter_kg')
      .in('project_no', chunk)

    if (error) {
      throw handleApiError(error, '获取项目比重失败')
    }

    ;((data || []) as Array<{
      project_no: string | null
      weight_per_meter_kg: number | null
    }>).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
}

export async function getPrecisionFinishingCuttings({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & PrecisionFinishingCuttingFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 列表所需列（表格 + 编辑表单/移动编辑共用字段）
  let query = getPrecisionFinishingCuttingsQuery()
    .select(
      'id, created_at, audited_at, is_audited, customer, customer_model, project_no, product_model, length_mm, transfer_quantity, target_workshop, operator_names, operator_employee_id, operator_employee_ids, outsource_defect_quantity, outsource_unit, outsource_defect_reason, long_material_length_mm, long_material_quantity, raw_material_defect_count, processing_defect_count, defect_reason, responsible_process, process_owner, recipient_name, inspector_name, uploaded_by_name, remark',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  query = applyPrecisionFinishingCuttingFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取精加工切割单列表失败')
  }

  return {
    items: (data || []) as PrecisionFinishingCuttingWithEmployee[],
    total: count || 0,
  }
}

export async function getPrecisionFinishingCuttingById(id: string) {
  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取精加工切割单详情失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function getPrecisionFinishingCuttingsForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionFinishingCuttingFilters
}): Promise<PrecisionFinishingCuttingExportRow[]> {
  if ((!ids || ids.length === 0) && !filters) {
    return []
  }

  const rows: PrecisionFinishingCuttingRow[] = []

  if (ids && ids.length > 0) {
    const { data, error } = await getPrecisionFinishingCuttingsQuery()
      .select('*')
      .order('created_at', { ascending: true })
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取精加工切割单导出数据失败')
    }

    rows.push(...((data || []) as PrecisionFinishingCuttingRow[]))
  }
  else if (filters) {
    let from = 0

    while (true) {
      const to = from + EXPORT_PAGE_SIZE - 1
      let query = getPrecisionFinishingCuttingsQuery()
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, to)

      query = applyPrecisionFinishingCuttingFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取精加工切割单导出数据失败')
      }

      const pageRows = (data || []) as PrecisionFinishingCuttingRow[]
      rows.push(...pageRows)

      if (pageRows.length < EXPORT_PAGE_SIZE) {
        break
      }

      from += EXPORT_PAGE_SIZE
    }
  }

  const weightMap = await getProjectWeightMap(rows.map(row => row.project_no))

  const rowsWithWeight = rows.map((row) => {
    const weightPerMeterKg = weightMap.get(row.project_no) || 0
    const lengthMm = Number(row.length_mm || 0)

    return {
      ...row,
      raw_material_defect_weight_kg: roundTo(
        (Number(row.raw_material_defect_count || 0) * lengthMm * weightPerMeterKg)
        / 1000,
      ),
      processing_defect_weight_kg: roundTo(
        (Number(row.processing_defect_count || 0) * lengthMm * weightPerMeterKg)
        / 1000,
      ),
    }
  })

  if (!ids || ids.length === 0) {
    return rowsWithWeight
  }

  const rowMap = new Map(rowsWithWeight.map(row => [row.id, row]))

  return ids
    .map(id => rowMap.get(id))
    .filter((row): row is PrecisionFinishingCuttingExportRow => Boolean(row))
}

export async function getPrecisionFinishingCuttingQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionFinishingCuttingFilters
} = {}): Promise<PrecisionFinishingCuttingQuantityStats> {
  const rows: Array<{ transfer_quantity: number | null }> = []

  if (ids && ids.length > 0) {
    const { data, error } = await getPrecisionFinishingCuttingsQuery()
      .select('id, transfer_quantity')
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取精加工切割单数量统计失败')
    }

    rows.push(...((data || []) as Array<{ transfer_quantity: number | null }>))
  }
  else if (filters) {
    let from = 0

    while (true) {
      const to = from + EXPORT_PAGE_SIZE - 1
      let query = getPrecisionFinishingCuttingsQuery()
        .select('id, transfer_quantity')
        .range(from, to)

      query = applyPrecisionFinishingCuttingFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取精加工切割单数量统计失败')
      }

      const pageRows = (data || []) as Array<{
        transfer_quantity: number | null
      }>
      rows.push(...pageRows)

      if (pageRows.length < EXPORT_PAGE_SIZE) {
        break
      }

      from += EXPORT_PAGE_SIZE
    }
  }

  return {
    totalQuantity: rows.reduce(
      (total: number, row) => total + Number(row.transfer_quantity || 0),
      0,
    ),
    totalRecords: rows.length,
  }
}
