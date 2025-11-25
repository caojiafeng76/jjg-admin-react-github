import { ISyneyItem, ISyneyPo } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

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
    // 匹配 "品牌:" 后面的内容,支持括号(如 "现代电梯(杭州)有限公司")
    const brandMatch = backPlateItem.Remark.match(
      /品牌[::\s]*([^\s]+(?:\([^)]+\))?[^\s]*)/,
    )
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
    const specMatch = frontPlateItem.Spec.match(/(1000型|800型|600型)/)
    if (specMatch) {
      model = specMatch[1]
    }
  }

  if (!model) {
    return null
  }

  // 3. 从件号判断类型（扶梯/人行道）
  let type = ''
  const partNo = frontPlateItem.PartNo || ''

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
  const middlePlateItem = items.find(
    (item) =>
      item.PartName?.includes('中板') ||
      item.PartNo?.startsWith('XN2808BP') ||
      item.PartNo?.startsWith('XN2808BQ') ||
      item.PartNo?.startsWith('XN3024BS') ||
      item.PartNo?.startsWith('XN3024BT'),
  )

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
      'id, No, SONo, Spec, EndDate, Status, Qty, Brand, Technique, SerialNo, Remark, created_at',
      { count: 'exact' },
    )
    .order('EndDate', { ascending: false })
    .order('No', { ascending: true })
    .order('SONo', { ascending: true })
    .order('SerialNo', { ascending: true })

  if (page && pageSize) {
    const from = (page - 1) * pageSize
    const to = from + pageSize

    query = query.range(from, to - 1)
  }

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
    throw handleApiError(error, '订单列表获取失败')
  }

  return { syneyPos, count }
}

export default async function getSyneyPo(id: string, signal?: AbortSignal) {
  let query = supabase.from('syney-pos').select('*').eq('id', +id)

  // 支持请求取消
  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.single()

  if (error) {
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

        const poItems = items?.map((item) => ({
          No: item.No,
          PartNo: item.PartNo,
          PartName: item.PartName,
          PartName2: item.PartName2,
          Spec: item.Spec,
          ParamSpec: item.ParamSpec,
          Unit: item.Unit,
          Qty: item.Qty,
          SONo: item.SONo,
          PartCode: item.PartCode,
          PartModel: item.PartModel,
          Remark: item.Remark,
          PoId: poRepo.id,
        }))

        const { error: itemsError } = await supabase
          .from('syney-po-items')
          .insert(poItems as ISyneyItem[])

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

export async function deletePo(ids: string[]) {
  const { error } = await supabase
    .from('syney-pos')
    .delete()
    .in('id', ids.map(Number))

  if (error) {
    throw handleApiError(error, '订单删除失败')
  }
}

export async function updatePos({
  ids,
  data,
}: {
  ids: string[]
  data: Partial<ISyneyPo>
}) {
  const { error } = await supabase
    .from('syney-pos')
    .update(data)
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
    const key = `${po.SONo}~${po.Spec}~${po.EndDate}~${po.No}~${po.SerialNo}~${po.Brand}~${po.Technique}~${po.Remark}`
    const items = itemsByPoId.get(po.id) || []
    map.set(key, items)
  })

  return map
}
