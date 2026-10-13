import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import {
  applyMaterialTransferFilters,
  normalizeMaterialTransferInsertPayload,
  normalizeMaterialTransferUpdatePayload,
} from './apiMaterialTransfersCalculations'
import type {
  MaterialTransferFilters,
  MaterialTransferInsert,
  MaterialTransferInsertBase,
  MaterialTransferQuantityStats,
  MaterialTransferUpdate,
  MaterialTransferUpdateBase,
  MaterialTransferWithEmployee,
  ProjectTransferStats,
  TransferWorkshopStat,
} from './apiMaterialTransfersTypes'

export * from './apiMaterialTransfersTypes'
export {
  buildOrderProgressMap,
  computeOrderProgress,
} from './apiMaterialTransfersCalculations'

const MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE = 1000

export async function getMaterialTransferProjectNos() {
  const values = new Set<string>()
  let from = 0

  while (true) {
    const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('material_transfers')
      .select('project_no')
      .not('project_no', 'is', null)
      .order('project_no', { ascending: true })
      .range(from, to)

    if (error) throw handleApiError(error, '获取项目号选项失败')

    const rows = data || []
    rows.forEach((item) => {
      if (item.project_no) values.add(item.project_no.trim())
    })

    if (rows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) break
    from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export async function getMaterialTransferModels() {
  const values = new Set<string>()
  let from = 0

  while (true) {
    const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('material_transfers')
      .select('product_model')
      .not('product_model', 'is', null)
      .order('product_model', { ascending: true })
      .range(from, to)

    if (error) throw handleApiError(error, '获取型号选项失败')

    const rows = data || []
    rows.forEach((item) => {
      if (item.product_model) values.add(item.product_model.trim())
    })

    if (rows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) break
    from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export async function getMaterialTransferLengths() {
  const values = new Set<number>()
  let from = 0

  while (true) {
    const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('material_transfers')
      .select('length_mm')
      .not('length_mm', 'is', null)
      .order('length_mm', { ascending: true })
      .range(from, to)

    if (error) throw handleApiError(error, '获取长度选项失败')

    const rows = data || []
    rows.forEach((item) => {
      if (item.length_mm !== null) values.add(item.length_mm as number)
    })

    if (rows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) break
    from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
  }

  return Array.from(values).sort((a, b) => a - b)
}

async function attachOrderAppearance(
  rows: MaterialTransferWithEmployee[],
): Promise<MaterialTransferWithEmployee[]> {
  const projectNos = [
    ...new Set(rows.map((row) => row.project_no.trim()).filter(Boolean)),
  ]
  const appearance = new Map<
    string,
    { product_category: string | null; color_name: string | null }
  >()

  for (let offset = 0; offset < projectNos.length; offset += 100) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, product_category, color_name')
      .in('project_no', projectNos.slice(offset, offset + 100))

    if (error) throw handleApiError(error, '获取订单表面处理和颜色失败')

    for (const order of data || []) {
      if (order.project_no) appearance.set(order.project_no.trim(), order)
    }
  }

  return rows.map((row) => {
    const order = appearance.get(row.project_no.trim())
    return {
      ...row,
      product_category: order?.product_category ?? null,
      color_name: order?.color_name ?? null,
    }
  })
}

export async function getMaterialTransfers({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & MaterialTransferFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 列表所需列（表格 + 编辑表单/移动编辑共用字段）
  let query = supabase
    .from('material_transfers')
    .select(
      'id, created_at, audited_at, is_audited, project_no, customer, product_model, customer_model, length_mm, transfer_quantity, operator_employee_ids, operator_names, target_workshop, recipient_name, shift_leader_name, inspector_name, uploaded_by_name, remark',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  query = applyMaterialTransferFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取物料转移单列表失败')
  }

  return {
    items: await attachOrderAppearance(
      (data || []) as unknown as MaterialTransferWithEmployee[],
    ),
    total: count || 0,
  }
}

export async function getMaterialTransferById(id: string) {
  const { data, error } = await supabase
    .from('material_transfers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取物料转移单详情失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function getMaterialTransfersForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: MaterialTransferFilters
}) {
  if ((!ids || ids.length === 0) && !filters) {
    return [] as MaterialTransferWithEmployee[]
  }

  const rows: MaterialTransferWithEmployee[] = []

  if (ids && ids.length > 0) {
    const { data, error } = await supabase
      .from('material_transfers')
      .select('*')
      .order('created_at', { ascending: true })
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取物料转移单导出数据失败')
    }

    rows.push(...((data || []) as unknown as MaterialTransferWithEmployee[]))
  } else if (filters) {
    let from = 0

    while (true) {
      const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
      let query = supabase
        .from('material_transfers')
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, to)

      query = applyMaterialTransferFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取物料转移单导出数据失败')
      }

      const pageRows = (data || []) as unknown as MaterialTransferWithEmployee[]
      rows.push(...pageRows)

      if (pageRows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) {
        break
      }

      from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
    }
  }

  if (!ids || ids.length === 0) {
    return attachOrderAppearance(rows)
  }

  const rowMap = new Map(rows.map((row) => [row.id, row]))

  return attachOrderAppearance(
    ids
      .map((id) => rowMap.get(id))
      .filter((row): row is MaterialTransferWithEmployee => Boolean(row)),
  )
}

export async function getMaterialTransferQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: MaterialTransferFilters
} = {}): Promise<MaterialTransferQuantityStats> {
  const rows: Array<{ transfer_quantity: number | null }> = []

  if (ids && ids.length > 0) {
    const { data, error } = await supabase
      .from('material_transfers')
      .select('id, transfer_quantity')
      .in('id', ids)

    if (error) {
      throw handleApiError(error, '获取物料转移单数量统计失败')
    }

    rows.push(...((data || []) as Array<{ transfer_quantity: number | null }>))
  } else if (filters) {
    let from = 0

    while (true) {
      const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
      let query = supabase
        .from('material_transfers')
        .select('id, transfer_quantity')
        .range(from, to)

      query = applyMaterialTransferFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取物料转移单数量统计失败')
      }

      const pageRows = (data || []) as Array<{
        transfer_quantity: number | null
      }>
      rows.push(...pageRows)

      if (pageRows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) {
        break
      }

      from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
    }
  }

  return {
    totalQuantity: rows.reduce(
      (total, row) => total + Number(row.transfer_quantity || 0),
      0,
    ),
    totalRecords: rows.length,
  }
}

export async function createMaterialTransfer(values: MaterialTransferInsert) {
  const payload = normalizeMaterialTransferInsertPayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .insert(payload as MaterialTransferInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建物料转移单失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function updateMaterialTransfer({
  id,
  values,
}: {
  id: string
  values: MaterialTransferUpdate
}) {
  const payload = normalizeMaterialTransferUpdatePayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .update(payload as MaterialTransferUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新物料转移单失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function batchUpdateMaterialTransfers({
  ids,
  values,
}: {
  ids: string[]
  values: MaterialTransferUpdate
}) {
  if (ids.length === 0) {
    return [] as MaterialTransferWithEmployee[]
  }

  const payload = normalizeMaterialTransferUpdatePayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .update(payload as MaterialTransferUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新物料转移单失败')
  }

  return (data || []) as unknown as MaterialTransferWithEmployee[]
}

export async function deleteMaterialTransfers(ids: string[]) {
  const { error } = await supabase
    .from('material_transfers')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除物料转移单失败')
  }
}

export async function getTransferStatsByProjectNo(
  projectNo: string,
): Promise<ProjectTransferStats> {
  const rows: {
    target_workshop: string
    transfer_quantity: number
  }[] = []
  let from = 0

  while (true) {
    const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('material_transfers')
      .select('target_workshop, transfer_quantity')
      .eq('project_no', projectNo.trim())
      .order('target_workshop', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取转移单统计失败')
    }

    const pageRows = (data || []) as {
      target_workshop: string
      transfer_quantity: number
    }[]
    rows.push(...pageRows)

    if (pageRows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) {
      break
    }

    from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
  }

  const workshopMap = new Map<string, { total: number; count: number }>()
  for (const row of rows) {
    const current = workshopMap.get(row.target_workshop) ?? {
      total: 0,
      count: 0,
    }
    current.total += Number(row.transfer_quantity || 0)
    current.count += 1
    workshopMap.set(row.target_workshop, current)
  }

  const byWorkshop: TransferWorkshopStat[] = Array.from(
    workshopMap.entries(),
  ).map(([workshop, stat]) => ({
    target_workshop: workshop,
    total_quantity: stat.total,
    record_count: stat.count,
  }))

  const totalTransferred = rows.reduce(
    (sum, row) => sum + Number(row.transfer_quantity || 0),
    0,
  )

  const totalOutbound = totalTransferred

  const totalInWarehouse = workshopMap.get('仓库')?.total ?? 0

  return { byWorkshop, totalOutbound, totalInWarehouse, totalTransferred }
}

/**
 * 按项目号集合批量查询订单数量（sales_orders.order_quantity）。
 * 仅取项目号维度，不含 precision_cutting_transfers 等其他口径。
 */
export async function getOrderQuantitiesByProjectNos(
  projectNos: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (projectNos.length === 0) return map

  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no, order_quantity')
    .in('project_no', projectNos)

  if (error) {
    throw handleApiError(error, '获取订单数量失败')
  }

  for (const row of data || []) {
    if (!row.project_no) continue
    const key = row.project_no.trim()
    if (!key) continue
    map.set(key, Number(row.order_quantity ?? 0))
  }

  return map
}

/**
 * 按项目号集合批量聚合 material_transfers.transfer_quantity 总和。
 * 与 getTransferStatsByProjectNo(单号版) 互补，本函数一次查一组。
 */
export async function getTransferTotalByProjectNos(
  projectNos: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (projectNos.length === 0) return map

  // .in() 只能过滤项目号，不能限制每个项目的转移记录行数；
  // 多个项目合计记录数可能超过 1000，需分页循环拉全后再聚合。
  let from = 0

  while (true) {
    const to = from + MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('material_transfers')
      .select('project_no, transfer_quantity')
      .in('project_no', projectNos)
      .order('project_no', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取转移数量聚合失败')
    }

    const pageRows = (data || []) as Array<{
      project_no: string | null
      transfer_quantity: number | null
    }>

    for (const row of pageRows) {
      if (!row.project_no) continue
      const key = row.project_no.trim()
      if (!key) continue
      map.set(key, (map.get(key) ?? 0) + Number(row.transfer_quantity || 0))
    }

    if (pageRows.length < MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE) {
      break
    }

    from += MATERIAL_TRANSFER_OPTIONS_PAGE_SIZE
  }

  return map
}
