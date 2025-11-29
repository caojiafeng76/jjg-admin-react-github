import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

export async function getSerialNo() {
  const { data, error } = await supabase
    .from('syney-serial-no')
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '获取流水号失败')
  }

  return data
}

export async function updateSerialNo(serialNo: number) {
  const { data, error } = await supabase
    .from('syney-serial-no')
    .update({ SyneySerialNo: serialNo })
    .eq('id', 1)
    .single()

  if (error) {
    throw handleApiError(error, '更新编号失败')
  }

  return data
}

/**
 * 原子性递增序列号
 * 使用 PostgreSQL 存储过程确保线程安全，防止竞态条件
 * @param incrementBy - 需要递增的数量（默认为1）
 * @returns 递增后的新序列号
 */
export async function atomicIncrementSerialNo(incrementBy: number = 1) {
  // @ts-ignore - RPC 函数可能未在自动生成的类型中定义
  const { data, error } = await supabase.rpc('increment_serial_no', {
    increment_by: incrementBy,
  })

  if (error) {
    throw handleApiError(error, '序列号递增失败')
  }

  // PostgreSQL 函数返回新的序列号
  return data as number
}
