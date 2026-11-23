import type { Database } from './database.types'
import type { ISyneyItem, ISyneyPo } from './types'
import { handleApiError } from '@utils/errorHandler'
import supabase from './supabase'

type SyneyPoUpdate = Database['public']['Tables']['syney-pos']['Update']

export interface SelectedSyneyPoWithItems {
  po: ISyneyPo
  items: ISyneyItem[]
}

export function normalizeSyneyPoUpdatePayload(data: Partial<ISyneyPo>): SyneyPoUpdate {
  return {
    BorderMaterial: data.BorderMaterial,
    Brand: data.Brand,
    // 编辑时可清空送货单号：空字符串存为 NULL；未传（如只改状态）保持 undefined 不更新
    DeliveryNo:
      data.DeliveryNo === undefined ? undefined : data.DeliveryNo?.trim() || null,
    EndDate: data.EndDate,
    No: data.No,
    Qty: data.Qty,
    Remark: data.Remark,
    SerialNo: data.SerialNo,
    SONo: data.SONo,
    Spec: data.Spec,
    Status: data.Status,
    Technique: data.Technique,
  }
}

export async function getSyneyPos({
  page,
  pageSize,
  Status,
  startDate,
  endDate,
  SONo,
  signal,
}: {
  page: number
  pageSize: number
  Status: string
  startDate?: string
  endDate?: string
  SONo?: string
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('syney_pos_sorted')
    .select(
      'id, No, SONo, Spec, EndDate, Status, Qty, Brand, Technique, SerialNo, Remark, BorderMaterial, DeliveryNo, created_at',
      { count: 'exact' },
    )

  if (Status && Status !== '全部') {
    query = query.eq('Status', Status)
  }

  // 日期范围过滤
  if (startDate && endDate) {
    query = query.gte('EndDate', startDate).lte('EndDate', endDate)
  }
  else if (startDate) {
    query = query.gte('EndDate', startDate)
  }
  else if (endDate) {
    query = query.lte('EndDate', endDate)
  }

  // 订单号与生产号模糊搜索（去掉可能破坏 PostgREST or() 语法的字符）
  const keyword = SONo?.replace(/[,()]/g, ' ').trim()
  if (keyword) {
    query = query.or(`SONo.ilike.%${keyword}%,No.ilike.%${keyword}%`)
  }

  query = query
    .order('status_sort_weight', { ascending: true })
    .order('end_date_sort_key', { ascending: true })
    .order('no_natural_sort_key', { ascending: true })
    .order('sono_natural_sort_key', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data: syneyPos, count, error }
    = await query.overrideTypes<ISyneyPo[]>()

  if (error) {
    throw handleApiError(error, '订单列表获取失败')
  }

  return { syneyPos: syneyPos || [], count: count || 0 }
}

/**
 * 删除订单
 * @param ids - 订单ID数组（字符串格式）
 * @returns 删除结果，包含删除数量和删除的订单信息
 */
export async function deletePo(ids: string[]) {
  // 1. 参数验证
  if (!ids || ids.length === 0) {
    throw new Error('订单ID列表不能为空')
  }

  // 2. 类型转换和验证，同时去重
  const numericIds: number[] = []
  const invalidIds: string[] = []

  for (const id of ids) {
    const num = Number(id)
    if (Number.isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      invalidIds.push(id)
    }
    else {
      numericIds.push(num)
    }
  }

  // 去重
  const uniqueIds = Array.from(new Set(numericIds))

  if (invalidIds.length > 0) {
    throw new Error(`无效的订单ID: ${invalidIds.join(', ')}`)
  }

  if (uniqueIds.length === 0) {
    throw new Error('没有有效的订单ID')
  }

  // 3. 检查订单是否存在
  const { data: existingPos, error: checkError } = await supabase
    .from('syney-pos')
    .select('id, No, Status')
    .in('id', uniqueIds)

  if (checkError) {
    throw handleApiError(checkError, '查询订单失败')
  }

  if (!existingPos || existingPos.length === 0) {
    throw new Error('未找到要删除的订单')
  }

  // 检查是否有订单不存在
  if (existingPos.length !== uniqueIds.length) {
    const foundIds = new Set(existingPos.map(p => p.id))
    const missingIds = uniqueIds.filter(id => !foundIds.has(id))
    throw new Error(`以下订单不存在: ${missingIds.join(', ')}`)
  }

  // 4. 先删除关联的订单明细（确保数据一致性，即使数据库有级联删除）
  const { error: itemsError } = await supabase
    .from('syney-po-items')
    .delete()
    .in('PoId', uniqueIds)

  if (itemsError) {
    throw handleApiError(itemsError, '删除订单明细失败')
  }

  // 5. 删除订单主表
  const { data: deletedData, error } = await supabase
    .from('syney-pos')
    .delete()
    .in('id', uniqueIds)
    .select() // 返回删除的数据

  if (error) {
    throw handleApiError(error, '订单删除失败')
  }

  // 6. 返回删除结果
  return {
    deletedCount: deletedData?.length || 0,
    deletedIds: uniqueIds,
    deletedOrders: existingPos.map(p => ({
      id: p.id,
      No: p.No,
      Status: p.Status,
    })),
  }
}

export async function updatePos({
  ids,
  data,
}: {
  ids: string[]
  data: Partial<ISyneyPo>
}) {
  const numericIds = ids.map(Number).filter(id => Number.isInteger(id) && id > 0)
  if (numericIds.length === 0) {
    throw new Error('请先选择需要更新的订单')
  }

  const payload = normalizeSyneyPoUpdatePayload(data)

  const { error } = await supabase
    .from('syney-pos')
    .update(payload)
    .in('id', numericIds)

  if (error) {
    throw handleApiError(error, '订单更新失败')
  }
}

export async function getSelectedPosWithItems(
  PoIds: number[],
  signal?: AbortSignal,
): Promise<SelectedSyneyPoWithItems[]> {
  if (PoIds.length === 0) {
    return []
  }

  let itemsQuery = supabase.from('syney-po-items').select('*').in('PoId', PoIds)
  let posQuery = supabase
    .from('syney-pos')
    .select('*')
    .in('id', PoIds)
    .order('EndDate', { ascending: false })
    .order('No', { ascending: true })
    .order('SONo', { ascending: true })
    .order('SerialNo', { ascending: true })

  if (signal) {
    itemsQuery = itemsQuery.abortSignal(signal)
    posQuery = posQuery.abortSignal(signal)
  }

  // 1. 并行查询订单和明细
  const [itemsResult, posResult] = await Promise.all([itemsQuery, posQuery])

  if (itemsResult.error) {
    throw handleApiError(itemsResult.error, '订单明细获取失败')
  }

  if (posResult.error) {
    throw handleApiError(posResult.error, '订单获取失败')
  }

  // 2. 使用 Map 优化明细查找 (O(1) 查找)
  const itemsByPoId = new Map<number, ISyneyItem[]>()
  itemsResult.data.forEach((item) => {
    if (item.PoId) {
      const existing = itemsByPoId.get(item.PoId) || []
      existing.push(item)
      itemsByPoId.set(item.PoId, existing)
    }
  })

  // 3. 返回结构化数组（避免字段拼串破坏含特殊字符的备注或工艺要求）
  return posResult.data.map(po => ({
    po: po as ISyneyPo,
    items: itemsByPoId.get(po.id) || [],
  }))
}

/**
 * 按订单号取出该号下的全部订单行及明细（不只是勾选的行），
 * 生成送货单时 SCM 会勾选该订单号的全部明细，安全部件信息也必须完整。
 */
export async function getPosWithItemsByNos(nos: string[]) {
  if (nos.length === 0) {
    return []
  }

  const { data: pos, error: posError } = await supabase
    .from('syney-pos')
    .select('*')
    .in('No', nos)
    .order('No', { ascending: true })
    .order('SONo', { ascending: true })
    .order('SerialNo', { ascending: true })

  if (posError) {
    throw handleApiError(posError, '订单获取失败')
  }

  const poIds = pos.map(po => po.id)
  const { data: items, error: itemsError } = poIds.length
    ? await supabase.from('syney-po-items').select('*').in('PoId', poIds)
    : { data: [], error: null }

  if (itemsError) {
    throw handleApiError(itemsError, '订单明细获取失败')
  }

  const itemsByPoId = new Map<number, ISyneyItem[]>()
  items.forEach((item) => {
    if (item.PoId) {
      itemsByPoId.set(item.PoId, [...(itemsByPoId.get(item.PoId) ?? []), item])
    }
  })

  return pos.map(po => ({ po, items: itemsByPoId.get(po.id) ?? [] }))
}

/** 送货单生成后回写：该订单号下所有行写入 SCM 送货单号，状态改为「已送货」 */
export async function markPosDelivered(no: string, deliveryNo: string) {
  const { error } = await supabase
    .from('syney-pos')
    .update({ DeliveryNo: deliveryNo, Status: '已送货' })
    .eq('No', no)

  if (error) {
    throw handleApiError(error, '订单送货状态回写失败')
  }
}
