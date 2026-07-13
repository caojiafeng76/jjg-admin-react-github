import supabase from './supabase'
import {
  buildYoumaiProductDataOptionsQuery,
  YOUMAI_PRODUCT_DATA_OPTION_SELECT,
} from './youmaiOptions'
import { handleApiError } from '@/utils/errorHandler'

export interface YoumaiFinishedGoodsInventory {
  id: string
  product_data_id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
  pending_stock_in: number
  pending_stock_out: number
  current_stock: number
  final_stock: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface YoumaiFinishedGoodsInventoryFormValues {
  product_data_id: string
  pending_stock_in: number
  pending_stock_out: number
  current_stock: number
  remarks: string
}

export interface YoumaiFinishedGoodsInventoryImportRow {
  material_code: string
  current_stock: number
  remarks: string
}

export interface YoumaiProductDataOption {
  id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_finished_goods_inventory',
  )
}

function productDataTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_product_data',
  )
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeFormValues(
  values: YoumaiFinishedGoodsInventoryFormValues,
): YoumaiFinishedGoodsInventoryFormValues {
  return {
    product_data_id: values.product_data_id,
    pending_stock_in: normalizeQuantity(values.pending_stock_in),
    pending_stock_out: normalizeQuantity(values.pending_stock_out),
    current_stock: normalizeQuantity(values.current_stock),
    remarks: values.remarks.trim(),
  }
}

function normalizeImportRow(
  row: YoumaiFinishedGoodsInventoryImportRow,
): YoumaiFinishedGoodsInventoryImportRow {
  return {
    material_code: row.material_code.trim(),
    current_stock: normalizeQuantity(row.current_stock),
    remarks: row.remarks.trim(),
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

async function ensureInventoryProductUnique(
  productDataId: string,
  excludeId?: string,
) {
  let query = inventoryTable()
    .select('id')
    .eq('product_data_id', productDataId)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查优迈成品库存是否重复失败')
  }

  if ((data || []).length > 0) {
    throw new Error('该货品资料已存在成品库存记录，请勿重复创建')
  }
}

function buildInventoryPayload(
  snapshot: YoumaiProductDataOption,
  values: Pick<
    YoumaiFinishedGoodsInventoryFormValues,
    'pending_stock_in' | 'pending_stock_out' | 'current_stock' | 'remarks'
  >,
) {
  return {
    product_data_id: snapshot.id,
    material_code: snapshot.material_code,
    material_name: snapshot.material_name,
    model: snapshot.model,
    specification: snapshot.specification,
    specific_gravity: normalizeQuantity(snapshot.specific_gravity),
    pending_stock_in: normalizeQuantity(values.pending_stock_in),
    pending_stock_out: normalizeQuantity(values.pending_stock_out),
    current_stock: normalizeQuantity(values.current_stock),
    remarks: values.remarks.trim(),
  }
}

export async function getYoumaiProductDataOptions(
  keyword?: string,
  signal?: AbortSignal,
  limit?: number,
) {
  const query = buildYoumaiProductDataOptionsQuery(
    productDataTable().select(YOUMAI_PRODUCT_DATA_OPTION_SELECT),
    { keyword, signal, limit },
  )

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取优迈货品资料选项失败')
  }

  return (data || []) as YoumaiProductDataOption[]
}

export async function getYoumaiFinishedGoodsInventoryList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = inventoryTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `material_code.ilike.%${normalizedKeyword}%,material_name.ilike.%${normalizedKeyword}%,model.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('final_stock', { ascending: true })
    .order('material_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取优迈成品库存列表失败')
  }

  return {
    items: (data || []) as YoumaiFinishedGoodsInventory[],
    total: count || 0,
  }
}

export async function createYoumaiFinishedGoodsInventory(
  values: YoumaiFinishedGoodsInventoryFormValues,
) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  await ensureInventoryProductUnique(snapshot.id)

  const { error } = await inventoryTable().insert(
    buildInventoryPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建优迈成品库存失败')
  }
}

export async function updateYoumaiFinishedGoodsInventory({
  id,
  values,
}: {
  id: string
  values: YoumaiFinishedGoodsInventoryFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  await ensureInventoryProductUnique(snapshot.id, id)

  const { error } = await inventoryTable()
    .update(buildInventoryPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新优迈成品库存失败')
  }
}

export async function importYoumaiFinishedGoodsInventory(
  rows: YoumaiFinishedGoodsInventoryImportRow[],
) {
  const normalizedRows = rows.map(normalizeImportRow)
  const materialCodeSet = new Set<string>()

  for (const row of normalizedRows) {
    if (materialCodeSet.has(row.material_code)) {
      throw new Error(`Excel 中存在重复物料编码“${row.material_code}”`)
    }
    materialCodeSet.add(row.material_code)
  }

  const materialCodes = normalizedRows.map((row) => row.material_code)
  const { data: productRows, error: productError } = await productDataTable()
    .select(
      'id, material_code, material_name, model, specification, specific_gravity',
    )
    .in('material_code', materialCodes)

  if (productError) {
    throw handleApiError(productError, '校验优迈货品资料失败')
  }

  const productMap = new Map(
    ((productRows || []) as YoumaiProductDataOption[]).map((row) => [
      row.material_code,
      row,
    ]),
  )

  const missingCodes = materialCodes.filter((code) => !productMap.has(code))
  if (missingCodes.length > 0) {
    throw new Error(
      `以下物料编码未在优迈货品资料中维护，无法导入库存：${missingCodes.join('、')}`,
    )
  }

  const productIds = Array.from(
    new Set((productRows || []).map((row: { id: string }) => row.id)),
  )
  const { data: existingRows, error: existingError } = await inventoryTable()
    .select('id, product_data_id, pending_stock_in, pending_stock_out')
    .in('product_data_id', productIds)

  if (existingError) {
    throw handleApiError(existingError, '查询现有优迈成品库存失败')
  }

  const existingMap = new Map(
    (
      (existingRows || []) as Array<{
        id: string
        product_data_id: string
        pending_stock_in: number
        pending_stock_out: number
      }>
    ).map((row) => [row.product_data_id, row]),
  )

  const payload = normalizedRows.map((row) => {
    const product = productMap.get(row.material_code)
    if (!product) {
      throw new Error(`物料编码“${row.material_code}”未维护货品资料`)
    }

    const existing = existingMap.get(product.id)

    return {
      ...(existing?.id ? { id: existing.id } : {}),
      product_data_id: product.id,
      material_code: product.material_code,
      material_name: product.material_name,
      model: product.model,
      specification: product.specification,
      specific_gravity: normalizeQuantity(product.specific_gravity),
      pending_stock_in: normalizeQuantity(existing?.pending_stock_in),
      pending_stock_out: normalizeQuantity(existing?.pending_stock_out),
      current_stock: normalizeQuantity(row.current_stock),
      remarks: row.remarks,
    }
  })

  const { error } = await inventoryTable().upsert(payload, {
    onConflict: 'product_data_id',
  })

  if (error) {
    throw handleApiError(error, '批量导入优迈成品库存失败')
  }
}

export async function deleteYoumaiFinishedGoodsInventory(ids: string[]) {
  const { error } = await inventoryTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除优迈成品库存失败')
  }
}
