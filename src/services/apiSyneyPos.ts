import type { Database } from './database.types'
import { ISyneyItem, ISyneyPo } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

type SyneyPoUpdate = Database['public']['Tables']['syney-pos']['Update']

function normalizeSyneyPoUpdatePayload(data: Partial<ISyneyPo>): SyneyPoUpdate {
  return {
    BorderMaterial: data.BorderMaterial,
    Brand: data.Brand,
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

/**
 * 从订单条目中提取商标信息
 * @param items - 订单明细数组
 * @returns 提取的商标名称,如果没有找到则返回 null
 */
function extractBrandFromItems(items: ISyneyItem[]): string | null {
  // 查找后板组件（前沿后板组件）
  const backPlateItem = items.find(
    (item) =>
      item.PartName?.includes('前沿后板') || item.PartName?.includes('后板'),
  )

  if (backPlateItem && backPlateItem.Remark) {
    const remark = backPlateItem.Remark
    
    // 优先匹配 "商标为" 格式（如：商标为现代电梯）
    let brandMatch = remark.match(/商标为\s*([^\s，,。]+)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }
    
    // 匹配 "商标:" 或 "商标：" 格式
    brandMatch = remark.match(/商标[:：]\s*([^\s，,。]+)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }
    
    // 匹配 "品牌:" 后面的内容,支持括号(如 "现代电梯(杭州)有限公司")
    brandMatch = remark.match(/品牌[:：\s]*([^\s，,。]+(?:\([^)]+\))?[^\s，,。]*)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }
  }

  return null
}

/**
 * 从订单条目中提取规格信息
 * @param items - 订单明细数组
 * @returns 推断的规格,如果无法推断则返回 null
 */
function normalizePartNo(partNo: string) {
  return partNo.replace(/^[^A-Za-z0-9]+/, '')
}

function extractSpecFromItems(items: ISyneyItem[]): string | null {
  // 1. 查找前沿板组件
  const frontPlateItem = items.find(
    (item) =>
      item.PartName?.includes('前沿板') ||
      item.PartNo?.startsWith('XN2808EB') ||
      item.PartNo?.startsWith('XN3024BR'),
  )

  if (!frontPlateItem) {
    return null
  }

  // 2. 从 Spec 字段提取型号（1000型/800型/600型）
  let model = ''
  if (frontPlateItem.Spec) {
    const specMatch = frontPlateItem.Spec.match(/(1000(?:型)?|800(?:型)?|600(?:型)?)/)
    if (specMatch) {
      model = specMatch[1].includes('型') ? specMatch[1] : `${specMatch[1]}型`
    }
  }

  if (!model) {
    return null
  }

  // 3. 从件号判断类型（扶梯/人行道）
  let type = ''
  const partNo = normalizePartNo(frontPlateItem.PartNo || '')

  // XN2808EB 系列是扶梯，XN3024BR 系列是人行道
  if (partNo.startsWith('XN2808EB') || partNo.startsWith('XN2808')) {
    type = '扶梯'
  } else if (partNo.startsWith('XN3024BR') || partNo.startsWith('XN3024')) {
    type = '人行道'
  } else if (partNo.startsWith('XN2838')) {
    type = '扶梯' // 800型扶梯
  }

  if (!type) {
    return null
  }

  // 4. 从中板的 Spec 字段推断环境
  let environment = '室内' // 默认室内

  // 查找中板组件（上前中板组件、下前中板组件）
  const middlePlateItem = items.find((item) => {
    const partNo = normalizePartNo(item.PartNo || '')
    return (
      item.PartName?.includes('中板') ||
      partNo.startsWith('XN2808BP') ||
      partNo.startsWith('XN2808BQ') ||
      partNo.startsWith('XN3024BS') ||
      partNo.startsWith('XN3024BT') ||
      partNo.startsWith('XN3024AP') ||
      partNo.startsWith('XN3024AQ')
    )
  })

  if (middlePlateItem && middlePlateItem.Spec) {
    // 从 Spec 字段匹配环境（如 "1000型 室内" 或 "1000型 室外"）
    if (middlePlateItem.Spec.includes('室外')) {
      environment = '室外'
    } else if (middlePlateItem.Spec.includes('室内')) {
      environment = '室内'
    }
  }

  // 5. 组合规格
  const spec = `${model}-${environment}-${type}`

  // 6. 验证规格是否存在于支持的选项中
  const validSpecs = [
    '1000型-室内-扶梯',
    '1000型-室外-扶梯',
    '1000型-室内-人行道',
    '1000型-室外-人行道',
    '800型-室内-扶梯',
    '800型-室外-扶梯',
    '800型-室内-人行道',
    '800型-室外-人行道',
    '600型-室内-扶梯',
    '600型-室外-扶梯',
    '1000型-室内-老围框',
    '800型-室内-老围框',
    '600型-室内-老围框',
  ]

  return validSpecs.includes(spec) ? spec : null
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
  let query = supabase
    .from('syney-pos')
    // 选择所有必要字段
    .select(
      'id, No, SONo, Spec, EndDate, Status, Qty, Brand, Technique, SerialNo, Remark, BorderMaterial, created_at',
      { count: 'exact' },
    )

  if (Status && Status !== '全部') {
    query = query.eq('Status', Status)
  }

  // 日期范围过滤
  if (startDate && endDate) {
    query = query.gte('EndDate', startDate).lte('EndDate', endDate)
  } else if (startDate) {
    query = query.gte('EndDate', startDate)
  } else if (endDate) {
    query = query.lte('EndDate', endDate)
  }

  // 生产号模糊搜索
  if (SONo) {
    query = query.ilike('SONo', `%${SONo}%`)
  }

  // 支持请求取消
  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data: syneyPos, count, error } = await query

  if (error) {
    // 请求被取消时 Supabase 可能抛出 AbortError，这属于正常行为，这里直接返回空结果避免报错
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
    ) {
      return { syneyPos: [], count: 0 }
    }

    throw handleApiError(error, '订单列表获取失败')
  }

  // 自定义排序：已创建在前，部分入库次之，然后已入库，按交货日期升序排序，同一订单号按合同号升序排序
  if (syneyPos && syneyPos.length > 0) {
    // 定义状态优先级
    const getStatusPriority = (status: string | null | undefined): number => {
      if (status === '已创建') return 1
      if (status === '部分入库' || status === '部分送货') return 2
      if (status === '已入库') return 3
      return 4 // 其他状态排在最后
    }

    syneyPos.sort((a, b) => {
      // 1. 先按状态排序：已创建 > 部分入库/部分送货 > 已入库
      const statusPriorityA = getStatusPriority(a.Status)
      const statusPriorityB = getStatusPriority(b.Status)
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB
      }

      // 2. 同一状态下，按交货日期（EndDate）排序
      // 已入库状态按降序排序（从晚到早），其他状态按升序排序（从早到晚）
      const endDateA = a.EndDate || ''
      const endDateB = b.EndDate || ''
      const dateCompare = endDateA.localeCompare(endDateB, 'zh-CN')
      if (dateCompare !== 0) {
        // 如果状态是"已入库"，则降序排序（返回相反的比较结果）
        if (a.Status === '已入库') {
          return -dateCompare
        }
        return dateCompare
      }

      // 3. 同一交货日期，按订单号（No）排序
      const noA = a.No || ''
      const noB = b.No || ''
      const noCompare = noA.localeCompare(noB, 'zh-CN', { numeric: true })
      if (noCompare !== 0) {
        return noCompare
      }

      // 4. 同一订单号，按合同号（SONo）升序排序
      const sonoA = a.SONo || ''
      const sonoB = b.SONo || ''
      return sonoA.localeCompare(sonoB, 'zh-CN', { numeric: true })
    })

    // 分页处理
    if (page && pageSize) {
      const from = (page - 1) * pageSize
      const to = from + pageSize
      return {
        syneyPos: syneyPos.slice(from, to),
        count: count || 0,
      }
    }
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
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
    ) {
      return null
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

        if (!items || items.length === 0) return

        const poItems = items.map((item) => ({
          No: item.No,
          PartNo: item.PartNo,
          PartName: item.PartName,
          PartName2: item.PartName2 ?? null,
          Spec: item.Spec,
          ParamSpec: item.ParamSpec,
          Unit: item.Unit,
          Qty: item.Qty,
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
  } catch (error) {
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
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      invalidIds.push(id)
    } else {
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
    const foundIds = new Set(existingPos.map((p) => p.id))
    const missingIds = uniqueIds.filter((id) => !foundIds.has(id))
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
    deletedOrders: existingPos.map((p) => ({
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
    const key = `${po.SONo}~${po.Spec}~${po.EndDate}~${po.No}~${po.SerialNo}~${po.Brand}~${po.Technique}~${po.Remark}~${po.BorderMaterial}`
    const items = itemsByPoId.get(po.id) || []
    map.set(key, items)
  })

  return map
}
