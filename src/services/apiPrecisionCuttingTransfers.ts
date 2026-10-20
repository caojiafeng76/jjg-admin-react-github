import type {
  PrecisionCuttingTransferExportRow,
  PrecisionCuttingTransferFilters,
  PrecisionCuttingTransferInsert,
  PrecisionCuttingTransferInsertBase,
  PrecisionCuttingTransferQuantityStats,
  PrecisionCuttingTransferRow,
  PrecisionCuttingTransferUpdate,
  PrecisionCuttingTransferUpdateBase,
} from './apiPrecisionCuttingTransfersTypes'

import type { ProductionItemWithOrderDetail } from './apiProductionOrders'
import dayjs from 'dayjs'
import { handleApiError } from '@/utils/errorHandler'
import {
  applyPrecisionCuttingTransferFilters,
  chunkArray,
  normalizePrecisionCuttingTransferInsertPayload,
  normalizePrecisionCuttingTransferUpdatePayload,
  roundTo,
} from './apiPrecisionCuttingTransfersCalculations'
import supabase from './supabase'

export * from './apiPrecisionCuttingTransfersTypes'

const PRECISION_CUTTING_TRANSFERS_TABLE = 'precision_cutting_transfers'

function getPrecisionCuttingTransfersQuery() {
  return supabase.from(PRECISION_CUTTING_TRANSFERS_TABLE)
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

    ;(
      (data || []) as Array<{
        project_no: string | null
        weight_per_meter_kg: number | null
      }>
    ).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
}

export async function getPrecisionCuttingTransfers({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & PrecisionCuttingTransferFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 列表所需列（表格 + 编辑表单/移动编辑共用字段）
  let query = getPrecisionCuttingTransfersQuery()
    .select(
      'id, created_at, audited_at, is_audited, customer, customer_model, project_no, product_model, length_mm, transfer_quantity, target_workshop, operator_names, outsource_defect_quantity, outsource_unit, outsource_defect_reason, long_material_length_mm, long_material_quantity, process_card_long_material_quantity, erp_long_material_quantity, data_error_responsible, raw_material_defect_count, processing_defect_count, defect_reason, responsible_process, process_owner, recipient_name, inspector_name, uploaded_by_name, remark',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  query = applyPrecisionCuttingTransferFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取精切转移单列表失败')
  }

  return {
    items: (data || []) as PrecisionCuttingTransferRow[],
    total: count || 0,
  }
}

export async function getPrecisionCuttingTransferById(id: string) {
  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取精切转移单详情失败')
  }

  return data as PrecisionCuttingTransferRow
}

const EXPORT_PAGE_SIZE = 1000

export async function getPrecisionCuttingTransferItemsByProjectNo(
  projectNo: string,
): Promise<ProductionItemWithOrderDetail[]> {
  const rows: PrecisionCuttingTransferRow[] = []
  let from = 0

  while (true) {
    const to = from + EXPORT_PAGE_SIZE - 1
    const { data, error } = await getPrecisionCuttingTransfersQuery()
      .select('*')
      .eq('project_no', projectNo.trim())
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取精切转移单明细失败')
    }

    const pageRows = (data || []) as PrecisionCuttingTransferRow[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows.map((item) => {
    const processingDefectCount = Number(item.processing_defect_count || 0)
    const rawMaterialDefectCount = Number(item.raw_material_defect_count || 0)
    const outsourceDefectQuantity = Number(item.outsource_defect_quantity || 0)
    const totalDefect
      = processingDefectCount + rawMaterialDefectCount + outsourceDefectQuantity

    return {
      id: `precision-cutting-transfer:${item.id}`,
      operation: '精切切割',
      project_no: item.project_no,
      product_model: item.product_model,
      length_mm: item.length_mm,
      customer_model: item.customer_model,
      qualified_quantity: Number(item.transfer_quantity || 0),
      incoming_qualified_quantity:
        Number(item.transfer_quantity || 0) + totalDefect,
      defect_quantity_1: processingDefectCount,
      defect_quantity_2: rawMaterialDefectCount,
      defect_reason_1:
        processingDefectCount > 0 ? item.defect_reason?.trim() || '加工' : null,
      defect_reason_2: rawMaterialDefectCount > 0 ? '原料' : null,
      outsource_defect_quantity: outsourceDefectQuantity,
      outsource_defect_reason: item.outsource_defect_reason,
      outsource_unit: item.outsource_unit,
      setup_defect_quantity: 0,
      setup_responsible: null,
      standard_seconds: 0,
      remark: item.remark,
      order_id: item.id,
      order_date: dayjs(item.created_at).format('YYYY-MM-DD'),
      shift: '白班',
      employee_name: item.operator_names.filter(Boolean).join('、') || null,
    }
  })
}

export async function getPrecisionCuttingTransfersForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionCuttingTransferFilters
}): Promise<PrecisionCuttingTransferExportRow[]> {
  if ((!ids || ids.length === 0) && !filters) {
    return []
  }

  const rows: PrecisionCuttingTransferRow[] = []

  if (ids && ids.length > 0) {
    const { data, error } = await getPrecisionCuttingTransfersQuery()
      .select('*')
      .order('created_at', { ascending: true })
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取精切转移单导出数据失败')
    }

    rows.push(...((data || []) as PrecisionCuttingTransferRow[]))
  }
  else if (filters) {
    let from = 0

    while (true) {
      const to = from + EXPORT_PAGE_SIZE - 1
      let query = getPrecisionCuttingTransfersQuery()
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, to)

      query = applyPrecisionCuttingTransferFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取精切转移单导出数据失败')
      }

      const pageRows = (data || []) as PrecisionCuttingTransferRow[]
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
        (Number(row.raw_material_defect_count || 0)
          * lengthMm
          * weightPerMeterKg)
        / 1000,
      ),
      processing_defect_weight_kg: roundTo(
        (Number(row.processing_defect_count || 0)
          * lengthMm
          * weightPerMeterKg)
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
    .filter((row): row is PrecisionCuttingTransferExportRow => Boolean(row))
}

export async function getPrecisionCuttingTransferQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionCuttingTransferFilters
} = {}): Promise<PrecisionCuttingTransferQuantityStats> {
  const rows: Array<{ transfer_quantity: number | null }> = []

  if (ids && ids.length > 0) {
    const { data, error } = await getPrecisionCuttingTransfersQuery()
      .select('id, transfer_quantity')
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取精切转移单数量统计失败')
    }

    rows.push(...((data || []) as Array<{ transfer_quantity: number | null }>))
  }
  else if (filters) {
    let from = 0

    while (true) {
      const to = from + EXPORT_PAGE_SIZE - 1
      let query = getPrecisionCuttingTransfersQuery()
        .select('id, transfer_quantity')
        .range(from, to)

      query = applyPrecisionCuttingTransferFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取精切转移单数量统计失败')
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

export async function createPrecisionCuttingTransfer(
  values: PrecisionCuttingTransferInsert,
) {
  const payload = normalizePrecisionCuttingTransferInsertPayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .insert(payload as PrecisionCuttingTransferInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建精切转移单失败')
  }

  return data as PrecisionCuttingTransferRow
}

export async function updatePrecisionCuttingTransfer({
  id,
  values,
}: {
  id: string
  values: PrecisionCuttingTransferUpdate
}) {
  const payload = normalizePrecisionCuttingTransferUpdatePayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .update(payload as PrecisionCuttingTransferUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新精切转移单失败')
  }

  return data as PrecisionCuttingTransferRow
}

export async function batchUpdatePrecisionCuttingTransfers({
  ids,
  values,
}: {
  ids: string[]
  values: PrecisionCuttingTransferUpdate
}) {
  if (ids.length === 0) {
    return [] as PrecisionCuttingTransferRow[]
  }

  const payload = normalizePrecisionCuttingTransferUpdatePayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .update(payload as PrecisionCuttingTransferUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新精切转移单失败')
  }

  return (data || []) as PrecisionCuttingTransferRow[]
}

export async function deletePrecisionCuttingTransfers(ids: string[]) {
  const { error } = await getPrecisionCuttingTransfersQuery()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除精切转移单失败')
  }
}
