import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from '@/types/database.types'

export type ProcessStandard =
  Database['public']['Tables']['process_standards']['Row']

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

  return data?.standard_seconds as number
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
    .select('project_no, product_model, length_mm, customer_model')
    .not('project_no', 'is', null)
    .order('project_no', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取项目号列表失败')
  }

  return (data || []) as {
    project_no: string
    product_model: string | null
    length_mm: number | null
    customer_model: string | null
  }[]
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

  return data as {
    project_no: string
    product_model: string | null
    length_mm: number | null
    customer_model: string | null
  }
}
