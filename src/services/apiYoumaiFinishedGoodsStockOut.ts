import dayjs from 'dayjs'

import supabase from './supabase'
import {
  buildYoumaiProductDataOptionsQuery,
  YOUMAI_PRODUCT_DATA_OPTION_SELECT,
} from './youmaiOptions'
import { handleApiError } from '@/utils/errorHandler'

export type YoumaiFinishedGoodsStockOutStatus = '待审核' | '已审核'

export interface YoumaiProductDataOption {
  id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
}

export interface YoumaiFinishedGoodsStockOut {
  id: string
  product_data_id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
  purchase_order_no: string
  purchase_order_line_no: string
  delivery_date: string
  status: YoumaiFinishedGoodsStockOutStatus
  stock_out_quantity: number
  final_stock?: number | null
  remarks: string
  created_at: string
  updated_at: string
}

interface YoumaiFinishedGoodsInventorySnapshot {
  product_data_id: string
  final_stock: number
}

export interface YoumaiFinishedGoodsStockOutFormValues {
  product_data_id: string
  purchase_order_no: string
  purchase_order_line_no: string
  delivery_date: string
  status: YoumaiFinishedGoodsStockOutStatus
  stock_out_quantity: number
  remarks: string
}

export interface YoumaiFinishedGoodsStockOutBatchStatusValues {
  ids: string[]
  status: YoumaiFinishedGoodsStockOutStatus
}

export interface YoumaiFinishedGoodsStockOutImportRow {
  purchase_order_no: string
  purchase_order_line_no: string
  material_code: string
  material_name: string
  delivery_date: string
  stock_out_quantity: number
  remarks: string
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function stockOutTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_finished_goods_stock_out',
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

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim()
}

function normalizeDateString(value: string | null | undefined) {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error('交货日期不能为空')
  }

  const parsed = dayjs(normalized)

  if (!parsed.isValid()) {
    throw new Error('交货日期格式无效，请使用 YYYY-MM-DD')
  }

  return parsed.format('YYYY-MM-DD')
}

function getOrderLineKey(purchaseOrderNo: string, purchaseOrderLineNo: string) {
  return `${purchaseOrderNo}__${purchaseOrderLineNo}`
}

function normalizeFormValues(
  values: YoumaiFinishedGoodsStockOutFormValues,
): YoumaiFinishedGoodsStockOutFormValues {
  return {
    product_data_id: values.product_data_id,
    purchase_order_no: normalizeText(values.purchase_order_no),
    purchase_order_line_no: normalizeText(values.purchase_order_line_no),
    delivery_date: normalizeDateString(values.delivery_date),
    status: values.status || '待审核',
    stock_out_quantity: normalizeQuantity(values.stock_out_quantity),
    remarks: normalizeText(values.remarks),
  }
}

function normalizeImportRow(
  row: YoumaiFinishedGoodsStockOutImportRow,
): YoumaiFinishedGoodsStockOutImportRow {
  return {
    purchase_order_no: normalizeText(row.purchase_order_no),
    purchase_order_line_no: normalizeText(row.purchase_order_line_no),
    material_code: normalizeText(row.material_code),
    material_name: normalizeText(row.material_name),
    delivery_date: normalizeDateString(row.delivery_date),
    stock_out_quantity: normalizeQuantity(row.stock_out_quantity),
    remarks: normalizeText(row.remarks),
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

function buildStockOutPayload(
  snapshot: YoumaiProductDataOption,
  values: YoumaiFinishedGoodsStockOutFormValues,
) {
  return {
    product_data_id: snapshot.id,
    material_code: snapshot.material_code,
    material_name: snapshot.material_name,
    model: snapshot.model,
    specification: snapshot.specification,
    specific_gravity: normalizeQuantity(snapshot.specific_gravity),
    purchase_order_no: values.purchase_order_no,
    purchase_order_line_no: values.purchase_order_line_no,
    delivery_date: values.delivery_date,
    status: values.status,
    stock_out_quantity: normalizeQuantity(values.stock_out_quantity),
    remarks: values.remarks,
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

export async function getYoumaiFinishedGoodsStockOutList({
  page,
  pageSize,
  keyword,
  status,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: YoumaiFinishedGoodsStockOutStatus
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = stockOutTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `purchase_order_no.ilike.%${normalizedKeyword}%,purchase_order_line_no.ilike.%${normalizedKeyword}%,material_code.ilike.%${normalizedKeyword}%,material_name.ilike.%${normalizedKeyword}%,model.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .order('status', { ascending: false })
    .order('delivery_date', { ascending: true })
    .order('updated_at', { ascending: false })
    .order('purchase_order_no', { ascending: false })
    .order('purchase_order_line_no', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取优迈成品出库列表失败')
  }

  const items = (data || []) as YoumaiFinishedGoodsStockOut[]
  const productIds = Array.from(
    new Set(items.map((item) => item.product_data_id)),
  )
  const inventoryMap = new Map<string, number>()

  if (productIds.length > 0) {
    const { data: inventoryRows, error: inventoryError } = await (
      supabase as unknown as DynamicSupabaseTable
    )
      .from('youmai_finished_goods_inventory')
      .select('product_data_id, final_stock')
      .in('product_data_id', productIds)

    if (inventoryError) {
      throw handleApiError(inventoryError, '获取优迈成品库存快照失败')
    }

    ;((inventoryRows || []) as YoumaiFinishedGoodsInventorySnapshot[]).forEach(
      (row) => {
        inventoryMap.set(
          row.product_data_id,
          normalizeQuantity(row.final_stock),
        )
      },
    )
  }

  return {
    items: items.map((item) => ({
      ...item,
      final_stock: inventoryMap.get(item.product_data_id) ?? null,
    })),
    total: count || 0,
  }
}

export async function createYoumaiFinishedGoodsStockOut(
  values: YoumaiFinishedGoodsStockOutFormValues,
) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  const { error } = await stockOutTable().insert(
    buildStockOutPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建优迈成品出库失败')
  }
}

export async function updateYoumaiFinishedGoodsStockOut({
  id,
  values,
}: {
  id: string
  values: YoumaiFinishedGoodsStockOutFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getProductSnapshot(payload.product_data_id)

  const { error } = await stockOutTable()
    .update(buildStockOutPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新优迈成品出库失败')
  }
}

export async function batchUpdateYoumaiFinishedGoodsStockOutStatus({
  ids,
  status,
}: YoumaiFinishedGoodsStockOutBatchStatusValues) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条优迈成品出库数据')
  }

  const { error } = await stockOutTable()
    .update({ status })
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(
      error,
      `批量${status === '已审核' ? '审核' : '反审'}优迈成品出库失败`,
    )
  }
}

export async function importYoumaiFinishedGoodsStockOut(
  rows: YoumaiFinishedGoodsStockOutImportRow[],
) {
  const normalizedRows = rows.map(normalizeImportRow)
  const rowKeySet = new Set<string>()

  for (const row of normalizedRows) {
    const rowKey = getOrderLineKey(
      row.purchase_order_no,
      row.purchase_order_line_no,
    )

    if (rowKeySet.has(rowKey)) {
      throw new Error(
        `Excel 中存在重复采购订单明细“${row.purchase_order_no} / ${row.purchase_order_line_no}”`,
      )
    }

    rowKeySet.add(rowKey)
  }

  const materialCodes = Array.from(
    new Set(normalizedRows.map((row) => row.material_code)),
  )
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
      `以下物料编码未在优迈货品资料中维护，无法导入出库：${missingCodes.join('、')}`,
    )
  }

  const purchaseOrderNos = Array.from(
    new Set(normalizedRows.map((row) => row.purchase_order_no)),
  )
  const purchaseOrderLineNos = Array.from(
    new Set(normalizedRows.map((row) => row.purchase_order_line_no)),
  )

  let existingQuery = stockOutTable().select(
    'id, product_data_id, material_code, material_name, model, specification, specific_gravity, purchase_order_no, purchase_order_line_no, delivery_date, status, stock_out_quantity, remarks',
  )

  if (purchaseOrderNos.length > 0) {
    existingQuery = existingQuery.in('purchase_order_no', purchaseOrderNos)
  }

  if (purchaseOrderLineNos.length > 0) {
    existingQuery = existingQuery.in(
      'purchase_order_line_no',
      purchaseOrderLineNos,
    )
  }

  const { data: existingRows, error: existingError } = await existingQuery

  if (existingError) {
    throw handleApiError(existingError, '查询现有优迈成品出库失败')
  }

  const existingMap = new Map(
    ((existingRows || []) as YoumaiFinishedGoodsStockOut[]).map((row) => [
      getOrderLineKey(row.purchase_order_no, row.purchase_order_line_no),
      row,
    ]),
  )

  const payload = normalizedRows.map((row) => {
    const product = productMap.get(row.material_code)
    if (!product) {
      throw new Error(`物料编码“${row.material_code}”未维护货品资料`)
    }

    const existing = existingMap.get(
      getOrderLineKey(row.purchase_order_no, row.purchase_order_line_no),
    )

    if (existing?.status === '已审核') {
      return {
        id: existing.id,
        product_data_id: existing.product_data_id,
        material_code: existing.material_code,
        material_name: existing.material_name,
        model: existing.model,
        specification: existing.specification,
        specific_gravity: normalizeQuantity(existing.specific_gravity),
        purchase_order_no: existing.purchase_order_no,
        purchase_order_line_no: existing.purchase_order_line_no,
        delivery_date: existing.delivery_date,
        status: existing.status,
        stock_out_quantity: normalizeQuantity(existing.stock_out_quantity),
        remarks: row.remarks || existing.remarks,
      }
    }

    return {
      ...(existing?.id ? { id: existing.id } : {}),
      product_data_id: product.id,
      material_code: product.material_code,
      material_name: product.material_name,
      model: product.model,
      specification: product.specification,
      specific_gravity: normalizeQuantity(product.specific_gravity),
      purchase_order_no: row.purchase_order_no,
      purchase_order_line_no: row.purchase_order_line_no,
      delivery_date: row.delivery_date,
      status: existing?.status || '待审核',
      stock_out_quantity: normalizeQuantity(row.stock_out_quantity),
      remarks: row.remarks,
    }
  })

  const { error } = await stockOutTable().upsert(payload, {
    onConflict: 'purchase_order_no,purchase_order_line_no',
  })

  if (error) {
    throw handleApiError(error, '批量导入优迈成品出库失败')
  }
}

export async function deleteYoumaiFinishedGoodsStockOut(ids: string[]) {
  const { error } = await stockOutTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除优迈成品出库失败')
  }
}
