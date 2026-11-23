import { handleApiError } from '@utils/errorHandler'
import supabase from './supabase'

export async function getSerialNo(signal?: AbortSignal) {
  let query = supabase
    .from('syney-serial-no')
    .select('*')

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.single()

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
