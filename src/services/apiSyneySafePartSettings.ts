import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'
import type { Database } from './database.types'

const SAFE_PART_DRAWING_BUCKET = 'syney-safe-part-drawings'

export const SAFE_PART_DRAWING_ACCEPT =
  'application/pdf,image/png,image/jpeg,image/webp'

export const SAFE_PART_DRAWING_MAX_SIZE = 50 * 1024 * 1024

const SAFE_PART_DRAWING_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])

type SyneySafePartSettingBase =
  Database['public']['Tables']['syney_safe_part_settings']['Row']

type SyneySafePartDrawingFields = {
  drawing_file_path: string | null
  drawing_file_name: string | null
  drawing_file_mime_type: string | null
  drawing_file_size: number | null
  drawing_uploaded_at: string | null
}

type SyneySafePartSettingUpdate =
  Database['public']['Tables']['syney_safe_part_settings']['Update'] &
    Partial<SyneySafePartDrawingFields>

export type SyneySafePartSetting = SyneySafePartSettingBase &
  SyneySafePartDrawingFields

export function isSupportedSafePartDrawing(file: File) {
  return SAFE_PART_DRAWING_MIME_TYPES.has(file.type)
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDrawingPath(settingId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName) || 'drawing'
  return `${settingId}/${Date.now()}-${safeName}`
}

function assertSafePartDrawingFile(file: File) {
  if (!isSupportedSafePartDrawing(file)) {
    throw handleApiError(
      new Error('仅支持 PDF、PNG、JPG、WEBP 格式图纸'),
      '图纸格式不支持',
    )
  }

  if (file.size > SAFE_PART_DRAWING_MAX_SIZE) {
    throw handleApiError(new Error('图纸文件不能超过 50MB'), '图纸过大')
  }
}

export async function getSyneySafePartSettings() {
  const { data, error } = await supabase
    .from('syney_safe_part_settings')
    .select('*')
    .order('part_no')

  if (error) {
    throw handleApiError(error, '安全件设置列表获取失败')
  }

  return data as SyneySafePartSetting[]
}

export async function upsertSyneySafePartSetting(payload: {
  id?: string
  part_no: string
  name?: string | null
  part_model?: string | null
  part_code_prefix?: string | null
  english_name?: string | null
  need_print_label: boolean
  is_safe_part: boolean
  decomposition_role?: string | null
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

  return data as SyneySafePartSetting
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

export async function uploadSyneySafePartDrawing({
  setting,
  file,
}: {
  setting: Pick<SyneySafePartSetting, 'id' | 'drawing_file_path'>
  file: File
}) {
  assertSafePartDrawingFile(file)

  const filePath = buildDrawingPath(setting.id, file.name)
  const { error: uploadError } = await supabase.storage
    .from(SAFE_PART_DRAWING_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw handleApiError(uploadError, '图纸上传失败')
  }

  const drawingUpdate: SyneySafePartSettingUpdate = {
    drawing_file_path: filePath,
    drawing_file_name: file.name,
    drawing_file_mime_type: file.type,
    drawing_file_size: file.size,
    drawing_uploaded_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('syney_safe_part_settings')
    .update(drawingUpdate as never)
    .eq('id', setting.id)
    .select()
    .single()

  if (error) {
    await supabase.storage.from(SAFE_PART_DRAWING_BUCKET).remove([filePath])
    throw handleApiError(error, '图纸信息保存失败')
  }

  if (setting.drawing_file_path && setting.drawing_file_path !== filePath) {
    const { error: removeError } = await supabase.storage
      .from(SAFE_PART_DRAWING_BUCKET)
      .remove([setting.drawing_file_path])

    if (removeError) {
      console.warn('旧图纸删除失败:', removeError)
    }
  }

  return data as SyneySafePartSetting
}

export async function getSyneySafePartDrawingPreviewUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(SAFE_PART_DRAWING_BUCKET)
    .createSignedUrl(filePath, 5 * 60)

  if (error) {
    throw handleApiError(error, '图纸预览地址获取失败')
  }

  return data.signedUrl
}

export async function getSyneySafePartDrawingDownloadUrl({
  filePath,
  fileName,
}: {
  filePath: string
  fileName: string
}) {
  const { data, error } = await supabase.storage
    .from(SAFE_PART_DRAWING_BUCKET)
    .createSignedUrl(filePath, 60, { download: fileName })

  if (error) {
    throw handleApiError(error, '图纸下载地址获取失败')
  }

  return data.signedUrl
}
