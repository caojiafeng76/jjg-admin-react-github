import { ISyneyItem } from './types'
import supabase from '@services/supabase'
import { handleApiError } from '@utils/errorHandler'

export async function getSyneyStoreReports({
  status,
  page,
  pageSize,
}: {
  status: string
  page: number
  pageSize: number
}) {
  let query = supabase
    .from('syney-store-reports')
    // 只选择列表页需要的字段，不要查询 Detail 字段！
    .select('id, No, Status, TotalAmount, created_at', { count: 'exact' })
    .range(pageSize * (page - 1), pageSize * page - 1)
    .order('created_at', { ascending: false })
    .order('No')

  if (status !== 'all') {
    query = query.eq('Status', status)
  }

  const { data: syneyStoreReports, error, count } = await query

  if (error) {
    throw handleApiError(error, '入库单列表获取失败')
  }

  return { syneyStoreReports, count }
}

export async function getSyneyStoreReport(No: string) {
  const { data: syneyStoreReport, error } = await supabase
    .from('syney-store-report-items')
    .select('*')
    .eq('No', No)
    .order('PartNo')

  if (error) {
    throw handleApiError(error, '入库单详情获取失败')
  }

  return syneyStoreReport
}

export async function getSelectedSyneyStoreReports(Nos: string[]) {
  // 使用 Promise.all 并行查询，提升性能
  const [itemsResult, reportsResult] = await Promise.all([
    supabase
      .from('syney-store-report-items')
      .select('*')
      .in('No', Nos)
      .order('No'),
    supabase
      .from('syney-store-reports')
      .select('*')
      .in('No', Nos)
  ])

  const { data: itemsFromRepo, error: itemsError } = itemsResult
  const { data: reports, error: reportsError } = reportsResult

  if (itemsError) {
    throw handleApiError(itemsError, '选择的入库单获取失败')
  }

  if (reportsError) {
    throw handleApiError(reportsError, '选择的入库单获取失败')
  }

  // 使用 Map 提升查找性能，避免重复过滤和查找
  const reportsMap = new Map(
    reports?.map(report => [report.No, report])
  )

  const itemsGroupMap = new Map<string, ISyneyItem[]>()

  // 一次性分组，提升性能
  itemsFromRepo?.forEach(item => {
    const items = itemsGroupMap.get(item.No || '') || []
    items.push(item)
    itemsGroupMap.set(item.No || '', items)
  })

  // 构建最终结果Map
  const result = new Map<
    string,
    { items: ISyneyItem[]; totalAmount: number; createdAt: string }
  >()

  Nos.forEach(No => {
    const items = itemsGroupMap.get(No) || []
    const report = reportsMap.get(No)

    result.set(No, {
      items,
      totalAmount: report?.TotalAmount ?? 0,
      createdAt: report?.created_at ?? '',
    })
  })

  return result
}

export async function createSyneyStoreReport({
  No,
  TotalAmount,
  items,
}: {
  No: string
  TotalAmount: number
  items: ISyneyItem[]
}) {
  const { data: syneyStoreReportFormRepo, error: reportError } = await supabase
    .from('syney-store-reports')
    .insert([{ No, TotalAmount }])
    .select('No')
    .single()

  if (reportError) {
    throw handleApiError(reportError, '入库单创建失败')
  }

  // 过滤掉数据库中不存在的字段（PartCode、PartModel、PartName2）
  const filteredItems = items.map((item) => ({
    No: item.No,
    ParamSpec: item.ParamSpec,
    PartName: item.PartName,
    PartNo: item.PartNo,
    Qty: item.Qty,
    Remark: item.Remark,
    SONo: item.SONo,
    Spec: item.Spec,
    TaxTotalPrice: item.TaxTotalPrice,
    TaxUnitPrice: item.TaxUnitPrice,
    Unit: item.Unit,
  }))

  const { data, error } = await supabase
    .from('syney-store-report-items')
    .insert(filteredItems)
    .select()

  if (error) {
    await supabase
      .from('syney-store-reports')
      .delete()
      .eq('No', syneyStoreReportFormRepo.No)
    throw handleApiError(error, '入库单明细创建失败')
  }

  return data
}

export async function deleteSyneyStoreReport(Nos: string[]) {
  const { error } = await supabase
    .from('syney-store-reports')
    .delete()
    .in('No', Nos)

  if (error) {
    throw handleApiError(error, '入库单删除失败')
  }
}

export async function updateSyneyStoreReports({
  Nos,
  Status,
}: {
  Nos: string[]
  Status: string
}) {
  const { error } = await supabase
    .from('syney-store-reports')
    .update({ Status })
    .in('No', Nos)

  if (error) {
    throw handleApiError(error, '入库单状态更新失败')
  }
}
