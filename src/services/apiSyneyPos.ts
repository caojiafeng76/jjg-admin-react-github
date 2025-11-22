import { ISyneyItem, ISyneyPo } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

export async function getSyneyPos({
  page,
  pageSize,
  Status,
  startDate,
  endDate,
  SONo,
}: {
  page: number
  pageSize: number
  Status: string
  startDate?: string
  endDate?: string
  SONo?: string
}) {
  let query = supabase
    .from('syney-pos')
    .select('*', { count: 'exact' })
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

  const { data: syneyPos, count, error } = await query

  if (error) {
    throw handleApiError(error, '订单列表获取失败')
  }

  return { syneyPos, count }
}

export default async function getSyneyPo(id: string) {
  const { data, error } = await supabase
    .from('syney-pos')
    .select('*')
    .eq('id', +id)
    .single()

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
  await Promise.all(
    Array.from(map.keys()).map(async (key) => {
      const [SONo, SerialNo] = key.split('~')
      const items = map.get(key)

      const { data: poRepo, error: poError } = await supabase
        .from('syney-pos')
        .insert([{ ...po, SONo, SerialNo: +SerialNo }])
        .select()
        .single()

      if (poError) {
        throw handleApiError(poError, '订单创建失败')
      }

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
        await supabase.from('syney-pos').delete().eq('id', poRepo.id)
        throw handleApiError(itemsError, '订单明细创建失败')
      }
    }),
  )
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
  const { data: selectedPoItems, error: itemsError } = await supabase
    .from('syney-po-items')
    .select('*')
    .in('PoId', PoIds)

  if (itemsError) {
    throw handleApiError(itemsError, '订单明细获取失败')
  }

  const { data: selectedPos, error: posError } = await supabase
    .from('syney-pos')
    .select('*')
    .in('id', PoIds)
    .order('EndDate', { ascending: false }) // 按交货日期降序
    .order('No', { ascending: true }) // 按订单号升序
    .order('SONo', { ascending: true }) // 按销售订单号升序
    .order('SerialNo', { ascending: true }) // 按序列号升序

  if (posError) {
    throw handleApiError(posError, '订单获取失败')
  }

  const map = new Map<string, ISyneyItem[]>()

  selectedPos
    .map((po) => ({
      id: po.id,
      SONo: po.SONo,
      Spec: po.Spec,
      EndDate: po.EndDate,
      No: po.No,
      SerialNo: po.SerialNo,
      Brand: po.Brand,
      Technique: po.Technique,
      Remark: po.Remark,
    }))
    .forEach((po) => {
      map.set(
        `${po.SONo}~${po.Spec}~${po.EndDate}~${po.No}~${po.SerialNo}~${po.Brand}~${po.Technique}~${po.Remark}`,
        selectedPoItems.filter((item) => item.PoId === po.id),
      )
    })

  return map
}
