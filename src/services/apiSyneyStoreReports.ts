import { ISyneyItem } from '@/types'
import supabase from '@services/supabase'

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
    .select('*', { count: 'exact' })
    .range(pageSize * (page - 1), pageSize * page - 1)
    .order('created_at', { ascending: false })
    .order('No')

  if (status !== 'all') {
    query = query.eq('Status', status)
  }

  const { data: syneyStoreReports, error, count } = await query

  if (error) {
    console.error(error)
    throw new Error('入库单列表获取失败')
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
    console.error(error)
    throw new Error('入库单详情获取失败')
  }

  return syneyStoreReport
}

export async function getSelectedSyneyStoreReports(Nos: string[]) {
  const itemsQuery = supabase
    .from('syney-store-report-items')
    .select(`*`)
    .in('No', Nos)
    .order('No')

  const reportsQuery = supabase
    .from('syney-store-reports')
    .select(`*`)
    .in('No', Nos)

  const { data: itemsFromRepo, error: itemsError } = await itemsQuery
  const { data: reports, error: reportsError } = await reportsQuery

  if (itemsError) {
    console.error(itemsError)
    throw new Error('选择的入库单获取失败')
  }

  if (reportsError) {
    console.error(reportsError)
    throw new Error('选择的入库单获取失败')
  }

  const map = new Map<
    string,
    { items: ISyneyItem[]; totalAmount: number; createdAt: string }
  >(
    Nos.map((No) => {
      const items = itemsFromRepo?.filter((item) => item.No === No)

      const report = reports?.find((report) => report.No === No)

      return [
        No,
        {
          items: items!,
          totalAmount: report?.TotalAmount ?? 0,
          createdAt: report?.created_at ?? '',
        },
      ]
    }),
  )

  return map
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
    console.error(reportError)
    throw new Error('入库单创建失败')
  }

  const { data, error } = await supabase
    .from('syney-store-report-items')
    .insert(items)
    .select()

  if (error) {
    await supabase
      .from('syney-store-reports')
      .delete()
      .eq('No', syneyStoreReportFormRepo.No)
    console.error(error)
    throw new Error('入库单明细创建失败')
  }

  return data
}

export async function deleteSyneyStoreReport(Nos: string[]) {
  const { error } = await supabase
    .from('syney-store-reports')
    .delete()
    .in('No', Nos)

  if (error) {
    console.error(error)
    throw new Error('入库单删除失败')
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
    console.error(error)
    throw new Error('入库单状态更新失败')
  }
}
