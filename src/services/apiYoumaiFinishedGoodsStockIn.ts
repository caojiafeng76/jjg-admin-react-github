import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export type YoumaiFinishedGoodsStockInStatus = '待审核' | '已审核'

export interface YoumaiProductDataOption {
  id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
}

export interface YoumaiFinishedGoodsStockIn {
  id: string
  product_data_id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
  status: YoumaiFinishedGoodsStockInStatus
  stock_in_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface YoumaiFinishedGoodsStockInFormValues {
  product_data_id: string
  status: YoumaiFinishedGoodsStockInStatus
  stock_in_quantity: number
  remarks: string
}

export interface YoumaiFinishedGoodsStockInBatchStatusValues {
  ids: string[]
  status: YoumaiFinishedGoodsStockInStatus
}

interface YoumaiFinishedGoodsStockInAuditRow {
  id: string
  product_data_id: string
  material_code: string
  material_name: string
  stock_in_quantity: number
}

interface YoumaiFinishedGoodsInventoryStockRow {
  product_data_id: string
  current_stock: number
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function stockInTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_finished_goods_stock_in',
  )
}

function productDataTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_product_data',
  )
}

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_finished_goods_inventory',
  )
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeFormValues(
  values: YoumaiFinishedGoodsStockInFormValues,
): YoumaiFinishedGoodsStockInFormValues {
  return {
    product_data_id: values.product_data_id,
    status: values.status || '待审核',
    stock_in_quantity: normalizeQuantity(values.stock_in_quantity),
    remarks: values.remarks.trim(),
  }
}

async function getProductSnapshot(productDataId: string) {
  const { data, error } = await productDataTable()
    .select(
      'id, material_code, material_name, model, specification, specific_gravity',
    )
    .eq('id', productDataId)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取优迈货品资料失败')
  }

  if (!data) {
    throw new Error('所选货品资料不存在，请先维护优迈货品资料')
  }

  return data as YoumaiProductDataOption
}

function buildStockInPayload(
  snapshot: YoumaiProductDataOption,
  values: YoumaiFinishedGoodsStockInFormValues,
) {
  return {
    product_data_id: snapshot.id,
    material_code: snapshot.material_code,
    material_name: snapshot.material_name,
    model: snapshot.model,
    specification: snapshot.specification,
    specific_gravity: normalizeQuantity(snapshot.specific_gravity),
    status: values.status,
    stock_in_quantity: normalizeQuantity(values.stock_in_quantity),
    remarks: values.remarks.trim(),
  }
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 3,
  })
}

async function assertCanReverseAuditedStockIn(ids: string[]) {
  const { data: stockInRows, error } = await stockInTable()
    .select(
      'id, product_data_id, material_code, material_name, stock_in_quantity',
    )
    .in('id', ids)
    .eq('status', '已审核')

  if (error) {
    throw handleApiError(error, '校验优迈成品入库反审库存失败')
  }

  const auditedRows = (stockInRows ||
    []) as YoumaiFinishedGoodsStockInAuditRow[]

  if (auditedRows.length === 0) {
    return
  }

  const requiredQuantityMap = new Map<
    string,
    {
      materialCode: string
      materialName: string
      quantity: number
    }
  >()

  auditedRows.forEach((row) => {
    const current = requiredQuantityMap.get(row.product_data_id)
    const quantity = normalizeQuantity(row.stock_in_quantity)

    if (current) {
      current.quantity += quantity
      return
    }

    requiredQuantityMap.set(row.product_data_id, {
      materialCode: row.material_code,
      materialName: row.material_name,
      quantity,
    })
  })

  const productDataIds = Array.from(requiredQuantityMap.keys())
  const { data: inventoryRows, error: inventoryError } = await inventoryTable()
    .select('product_data_id, current_stock')
    .in('product_data_id', productDataIds)

  if (inventoryError) {
    throw handleApiError(inventoryError, '校验优迈成品库存失败')
  }

  const currentStockMap = new Map(
    ((inventoryRows || []) as YoumaiFinishedGoodsInventoryStockRow[]).map(
      (row) => [row.product_data_id, normalizeQuantity(row.current_stock)],
    ),
  )

  const insufficientItems = productDataIds
    .map((productDataId) => {
      const required = requiredQuantityMap.get(productDataId)

      if (!required) {
        return null
      }

      const currentStock = currentStockMap.get(productDataId) ?? 0

      if (currentStock >= required.quantity) {
        return null
      }

      return `${required.materialCode} ${required.materialName}（需扣 ${formatQuantity(
        required.quantity,
      )}，现有 ${formatQuantity(currentStock)}）`
    })
    .filter((item): item is string => Boolean(item))

  if (insufficientItems.length > 0) {
    throw new Error(
      `库存不足，无法反审以下优迈成品入库：${insufficientItems.join(
        '；',
      )}。请先反审/删除后续出库或补足库存后再操作`,
    )
  }
}

export async function getYoumaiProductDataOptions(keyword?: string) {
  let query = productDataTable()
    .select(
      'id, material_code, material_name, model, specification, specific_gravity',
    )
    .order('material_code', { ascending: true })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `material_code.ilike.%${normalizedKeyword}%,material_name.ilike.%${normalizedKeyword}%,model.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取优迈货品资料选项失败')
  }

  return (data || []) as YoumaiProductDataOption[]
}

export async function getYoumaiFinishedGoodsStockInList({
  page,
  pageSize,
  keyword,
  status,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: YoumaiFinishedGoodsStockInStatus
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = stockInTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `material_code.ilike.%${normalizedKeyword}%,material_name.ilike.%${normalizedKeyword}%,model.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取优迈成品入库列表失败')
  }

  return {
    items: (data || []) as YoumaiFinishedGoodsStockIn[],
    total: count || 0,
  }
}

export async function createYoumaiFinishedGoodsStockIn(
  values: YoumaiFinishedGoodsStockInFormValues,
) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  const { error } = await stockInTable().insert(
    buildStockInPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建优迈成品入库失败')
  }
}

export async function updateYoumaiFinishedGoodsStockIn({
  id,
  values,
}: {
  id: string
  values: YoumaiFinishedGoodsStockInFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  const { error } = await stockInTable()
    .update(buildStockInPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新优迈成品入库失败')
  }
}

export async function batchUpdateYoumaiFinishedGoodsStockInStatus({
  ids,
  status,
}: YoumaiFinishedGoodsStockInBatchStatusValues) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条优迈成品入库数据')
  }

  if (status === '待审核') {
    await assertCanReverseAuditedStockIn(normalizedIds)
  }

  const { error } = await stockInTable()
    .update({ status })
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(
      error,
      `批量${status === '已审核' ? '审核' : '反审'}优迈成品入库失败`,
    )
  }
}

export async function deleteYoumaiFinishedGoodsStockIn(ids: string[]) {
  const { error } = await stockInTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除优迈成品入库失败')
  }
}
