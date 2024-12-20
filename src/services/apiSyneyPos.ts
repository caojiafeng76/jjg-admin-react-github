import { ISyneyItem, ISyneyPo } from '@/types'
import supabase from './supabase'

export async function getSyneyPos({
  page,
  pageSize,
  Status,
}: {
  page: number
  pageSize: number
  Status: string
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

  const { data: syneyPos, count, error } = await query

  if (error) {
    console.error(error)
    throw new Error('订单列表获取失败')
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
    console.error(error)
    throw new Error('获取订单详情失败')
  }

  return data
}

// export async function createPo({
//   po,
//   map,
// }: {
//   po: ISyneyPo
//   map: Map<string, ISyneyItem[]>
// }) {
//   map.forEach(async (items, key) => {
//     const [SONo, SerialNo] = key.split('~')

//     // console.log(po.SONo, po.SerialNo)
//     const { data: poRepo, error: poError } = await supabase
//       .from('syney-pos')
//       .insert([{ ...po, SONo, SerialNo: +SerialNo }])
//       .select()
//       .single()

//     if (poError) {
//       console.error(poError)
//       throw new Error('订单创建失败')
//     }

//     const poItems = items.map((item) => ({
//       No: item.No,
//       PartNo: item.PartNo,
//       PartName: item.PartName,
//       PartName2: item.PartName2,
//       Spec: item.Spec,
//       ParamSpec: item.ParamSpec,
//       Unit: item.Unit,
//       Qty: item.Qty,
//       SONo: item.SONo,
//       PartCode: item.PartCode,
//       PartModel: item.PartModel,
//       Remark: item.Remark,
//       PoId: poRepo.id,
//     }))

//     const { error: itemsError } = await supabase
//       .from('syney-po-items')
//       .insert(poItems)

//     if (itemsError) {
//       await supabase.from('syney-pos').delete().eq('id', poRepo.id)
//       console.error(itemsError)
//       throw new Error('订单明细创建失败')
//     }
//   })
// }

export async function createPo({
  po,
  map,
}: {
  po: ISyneyPo
  map: Map<string, ISyneyItem[]>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promises: any[] = []
  // 遍历map
  map.forEach((_items, key) => {
    const [SONo, SerialNo] = key.split('~')
    const insertPoPromise = supabase
      .from('syney-pos')
      .insert([{ ...po, SONo, SerialNo: +SerialNo }])
      .select()
      .single()
    promises.push(insertPoPromise)
  })

  try {
    const poRepoResults = await Promise.all(promises)
    for (let i = 0; i < poRepoResults.length; i++) {
      const { data: poRepo, error: poError } = poRepoResults[i]
      if (poError) {
        console.error(poError)
        throw new Error('订单创建失败')
      }
      const items = Array.from(map.values())[i]
      const poItems = items.map((item) => ({
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
        .insert(poItems)

      if (itemsError) {
        await supabase.from('syney-pos').delete().eq('id', poRepo.id)
        console.error(itemsError)
        throw new Error('订单明细创建失败')
      }
    }
  } catch (error) {
    console.error(error)
    // 这里可以根据具体需求进一步细化错误处理或者向外抛出更合适的错误提示等
    throw error
  }
}

export async function deletePo(ids: string[]) {
  const { error } = await supabase
    .from('syney-pos')
    .delete()
    .in('id', ids.map(Number))

  if (error) {
    console.error(error)
    throw new Error('订单删除失败')
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
    console.error(error)
    throw new Error('订单更新失败')
  }
}

export async function getSelectedPosWithItems(PoIds: number[]) {
  const { data: selectedPoItems, error: itemsError } = await supabase
    .from('syney-po-items')
    .select('*')
    .in('PoId', PoIds)

  if (itemsError) {
    console.error(itemsError)
    throw new Error('订单明细获取失败')
  }

  const { data: selectedPos, error: posError } = await supabase
    .from('syney-pos')
    .select('*')
    .in('id', PoIds)

  if (posError) {
    console.error(posError)
    throw new Error('订单获取失败')
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
