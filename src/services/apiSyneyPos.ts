import type { Database } from './database.types'
import type { ISyneyItem, ISyneyPo } from './types'
import { handleApiError } from '@utils/errorHandler'
import { extractBrandFromItems, extractSpecFromItems } from '@/utils/syneyOrderDefaults'
import supabase from './supabase'

type SyneyPoUpdate = Database['public']['Tables']['syney-pos']['Update']

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

  // 生产号模糊搜索
  if (SONo) {
    query = query.ilike('SONo', `%${SONo}%`)
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
    // 请求被取消时 Supabase 可能抛出 AbortError，这属于正常行为，这里直接返回空结果避免报错
    if (
      error
      && typeof error === 'object'
      && 'name' in error
      && (error as { name?: string }).name === 'AbortError'
    ) {
      return { syneyPos: [], count: 0 }
    }

    throw handleApiError(error, '订单列表获取失败')
  }

  return { syneyPos: syneyPos || [], count: count || 0 }
}

export default async function getSyneyPo(id: string, signal?: AbortSignal) {
  let query = supabase.from('syney-pos').select('*').eq('id', +id)

  // 支持请求取消
  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.single()

  if (error) {
    // 请求被取消时 Supabase 可能抛出 AbortError，这属于正常行为，这里直接返回 null 避免报错
    if (
      error
      && typeof error === 'object'
      && 'name' in error
      && (error as { name?: string }).name === 'AbortError'
    ) {
      return null
    }

    if (error.code === 'PGRST116') {
      throw new Error('入库单不存在或已被删除')
    }

    throw handleApiError(error, '获取订单详情失败')
  }

  return data
}

export async function createPo({
  po,
  map,
}: {
  po: ISyneyPo
  map: Map<string, ISyneyItem[]>
}) {
  // 追踪已创建的订单ID,用于失败时回滚
  const createdPoIds: number[] = []

  try {
    await Promise.all(
      Array.from(map.keys()).map(async (key) => {
        const [SONo, SerialNo] = key.split('~')
        const items = map.get(key)

        // 自动提取商标信息（从后板的 Remark）
        const extractedBrand = items ? extractBrandFromItems(items) : null
        const finalBrand = po.Brand || extractedBrand

        // 自动推断规格（从前沿板的 Spec 字段）
        const extractedSpec = items ? extractSpecFromItems(items) : null
        const finalSpec = po.Spec || extractedSpec

        const { data: poRepo, error: poError } = await supabase
          .from('syney-pos')
          .insert([
            {
              ...po,
              SONo,
              SerialNo: +SerialNo,
              Brand: finalBrand,
              Spec: finalSpec,
            },
          ])
          .select()
          .single()

        if (poError) {
          throw handleApiError(poError, '订单创建失败')
        }

        // 记录成功创建的订单ID
        createdPoIds.push(poRepo.id)

        if (!items || items.length === 0)
          return

        // 明细按 Excel 行原样入库，不去重（同件号多行是上/下头部等独立零件）
        const poItems = items.map(item => ({
          No: item.No,
          PartNo: item.PartNo,
          PartName: item.PartName,
          PartName2: item.PartName2 ?? null,
          Spec: item.Spec,
          ParamSpec: item.ParamSpec,
          Unit: item.Unit,
          Qty: item.Qty || 0,
          SONo: item.SONo,
          PartCode: item.PartCode ?? null,
          PartModel: item.PartModel ?? null,
          Remark: item.Remark,
          PoId: poRepo.id,
        }))

        const { error: itemsError } = await supabase
          .from('syney-po-items')
          .insert(poItems)

        if (itemsError) {
          throw handleApiError(itemsError, '订单明细创建失败')
        }
      }),
    )
  }
  catch (error) {
    // 清理所有已创建的订单,确保数据一致性
    if (createdPoIds.length > 0) {
      await supabase.from('syney-pos').delete().in('id', createdPoIds)
    }
    throw error
  }
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

  // 4. 可选：检查订单状态，某些状态的订单不允许删除
  // 根据业务需求，可以配置哪些状态不允许删除
  // 当前暂不限制，但保留扩展能力
  // const restrictedStatuses = ['已入库'] // 可根据业务需求调整
  // const restrictedPos = existingPos.filter(
  //   (p) => p.Status && restrictedStatuses.includes(p.Status),
  // )
  // if (restrictedPos.length > 0) {
  //   throw new Error(
  //     `以下订单状态不允许删除: ${restrictedPos.map((p) => p.No || p.id).join(', ')}`,
  //   )
  // }

  // 5. 先删除关联的订单明细（确保数据一致性，即使数据库有级联删除）
  const { error: itemsError } = await supabase
    .from('syney-po-items')
    .delete()
    .in('PoId', uniqueIds)

  if (itemsError) {
    throw handleApiError(itemsError, '删除订单明细失败')
  }

  // 6. 删除订单主表
  const { data: deletedData, error } = await supabase
    .from('syney-pos')
    .delete()
    .in('id', uniqueIds)
    .select() // 返回删除的数据

  if (error) {
    throw handleApiError(error, '订单删除失败')
  }

  // 7. 返回删除结果
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
  const payload = normalizeSyneyPoUpdatePayload(data)

  const { error } = await supabase
    .from('syney-pos')
    .update(payload)
    .in('id', ids.map(Number))

  if (error) {
    throw handleApiError(error, '订单更新失败')
  }
}

export async function getSelectedPosWithItems(PoIds: number[]) {
  if (PoIds.length === 0) {
    return new Map<string, ISyneyItem[]>()
  }

  // 1. 并行查询订单和明细
  const [itemsResult, posResult] = await Promise.all([
    supabase.from('syney-po-items').select('*').in('PoId', PoIds),
    supabase
      .from('syney-pos')
      .select('*')
      .in('id', PoIds)
      .order('EndDate', { ascending: false })
      .order('No', { ascending: true })
      .order('SONo', { ascending: true })
      .order('SerialNo', { ascending: true }),
  ])

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

  // 3. 构建结果 Map
  const map = new Map<string, ISyneyItem[]>()

  posResult.data.forEach((po) => {
    // 保持原有的键格式以确保兼容性
    const key = `${po.SONo}~${po.Spec}~${po.EndDate}~${po.No}~${po.SerialNo}~${po.Brand}~${po.Technique}~${po.Remark}~${po.BorderMaterial}~${po.DeliveryNo ?? ''}`
    const items = itemsByPoId.get(po.id) || []
    map.set(key, items)
  })

  return map
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
