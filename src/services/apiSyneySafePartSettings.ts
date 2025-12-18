import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'
import type { Database } from '@/types/database.types'

export type SyneySafePartSetting = Database['public']['Tables']['syney_safe_part_settings']['Row']

export async function getSyneySafePartSettings() {
  const { data, error } = await supabase
    .from('syney_safe_part_settings')
    .select('*')
    .order('part_no')

  if (error) {
    throw handleApiError(error, '安全件设置列表获取失败')
  }

  return data
}

export async function upsertSyneySafePartSetting(payload: {
  id?: string
  part_no: string
  name: string
  need_print_label: boolean
  is_safe_part: boolean
  remark?: string | null
}) {
  const { data, error } = await supabase
    .from('syney_safe_part_settings')
    .upsert(payload, { onConflict: 'part_no' })
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '安全件设置保存失败')
  }

  return data
}

export async function deleteSyneySafePartSettings(ids: string[]) {
  const { error } = await supabase
    .from('syney_safe_part_settings')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '安全件设置删除失败')
  }
}
