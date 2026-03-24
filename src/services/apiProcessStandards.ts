import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'

export type ProcessStandard =
  Database['public']['Tables']['process_standards']['Row']
type ProcessStandardStandardSeconds = Pick<
  ProcessStandard,
  'standard_seconds'
>
type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row']
type SalesOrderProjectNoOption = Pick<
  SalesOrderRow,
  'project_no' | 'product_model' | 'length_mm' | 'customer_model' | 'created_at'
> & {
  project_no: string
}
type SalesOrderProjectNoDetail = Pick<
  SalesOrderRow,
  'project_no' | 'product_model' | 'length_mm' | 'customer_model'
> & {
  project_no: string
}

export async function getOperationsByModel(model: string) {
  const { data, error } = await supabase
    .from('process_standards')
    .select('*')
    .eq('model', model)
    .order('operation', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取工序列表失败')
  }

  return (data || []) as ProcessStandard[]
}

export async function getStandardSeconds(model: string, operation: string) {
  const { data, error } = await supabase
    .from('process_standards')
    .select('standard_seconds')
    .eq('model', model)
    .eq('operation', operation)
    .single()

  if (error) {
    throw handleApiError(error, '获取标准工时失败')
  }

  return (data as ProcessStandardStandardSeconds | null)?.standard_seconds as number
}

export async function getModels() {
  const { data, error } = await supabase
    .from('process_standards')
    .select('model')
    .order('model', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取型号列表失败')
  }

  const uniqueModels = Array.from(
    new Set((data || []).map((item) => item.model)),
  )
  return uniqueModels as string[]
}

export async function getSalesOrdersProjectNos() {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no, product_model, length_mm, customer_model, created_at')
    .not('project_no', 'is', null)
    .order('created_at', { ascending: false })
    .order('project_no', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取项目号列表失败')
  }

  return ((data || []).filter(
    (item): item is SalesOrderProjectNoOption => item.project_no !== null,
  )) as SalesOrderProjectNoOption[]
}

export async function getSalesOrderByProjectNo(projectNo: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no, product_model, length_mm, customer_model')
    .eq('project_no', projectNo)
    .single()

  if (error) {
    throw handleApiError(error, '获取销售订单信息失败')
  }

  if (!data?.project_no) {
    throw new Error('销售订单项目号不存在')
  }

  return data as SalesOrderProjectNoDetail
}
