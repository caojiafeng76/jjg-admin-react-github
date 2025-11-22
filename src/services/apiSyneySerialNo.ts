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
