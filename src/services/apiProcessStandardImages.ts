import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { StandardTime } from './apiStandardTimes'

const PROCESS_STANDARD_IMAGE_BUCKET = 'process-standard-images'

export const PROCESS_STANDARD_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'
export const PROCESS_STANDARD_IMAGE_MAX_SIZE = 10 * 1024 * 1024

const PROCESS_STANDARD_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])

export interface ProcessStandardImageExportFile {
  fileName: string
  extension: string
  mimeType: string
  data: ArrayBuffer
}

export function isSupportedProcessStandardImage(file: File) {
  return PROCESS_STANDARD_IMAGE_MIME_TYPES.has(file.type)
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildImagePath(standardId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName) || 'process-image'
  return `${standardId}/${Date.now()}-${safeName}`
}

function assertProcessStandardImageFile(file: File) {
  if (!isSupportedProcessStandardImage(file)) {
    throw new Error('仅支持 PNG、JPG、WEBP 格式图示')
  }

  if (file.size > PROCESS_STANDARD_IMAGE_MAX_SIZE) {
    throw new Error('工艺图示不能超过 10MB')
  }
}

function getFileExtension(fileName: string, mimeType: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension
  }

  return mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
}

export async function uploadProcessStandardImage({
  standard,
  file,
}: {
  standard: Pick<StandardTime, 'id' | 'process_image_path'>
  file: File
}) {
  assertProcessStandardImageFile(file)

  const filePath = buildImagePath(standard.id, file.name)
  const { error: uploadError } = await supabase.storage
    .from(PROCESS_STANDARD_IMAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw handleApiError(uploadError, '工艺图示上传失败')
  }

  const { data, error } = await supabase
    .from('process_standards')
    .update({
      process_image_path: filePath,
      process_image_name: file.name,
      process_image_mime_type: file.type,
      process_image_size: file.size,
      process_image_uploaded_at: new Date().toISOString(),
    })
    .eq('id', standard.id)
    .select()
    .single()

  if (error) {
    await supabase.storage
      .from(PROCESS_STANDARD_IMAGE_BUCKET)
      .remove([filePath])
    throw handleApiError(error, '工艺图示信息保存失败')
  }

  if (standard.process_image_path && standard.process_image_path !== filePath) {
    const { error: removeError } = await supabase.storage
      .from(PROCESS_STANDARD_IMAGE_BUCKET)
      .remove([standard.process_image_path])

    if (removeError) {
      console.warn('旧工艺图示删除失败:', removeError)
    }
  }

  return data as StandardTime
}

export async function getProcessStandardImagePreviewUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(PROCESS_STANDARD_IMAGE_BUCKET)
    .createSignedUrl(filePath, 5 * 60)

  if (error) {
    throw handleApiError(error, '工艺图示预览地址获取失败')
  }

  return data.signedUrl
}

export async function getProcessStandardImageExportFile({
  filePath,
  fileName,
  mimeType,
}: {
  filePath: string
  fileName: string
  mimeType: string
}): Promise<ProcessStandardImageExportFile> {
  const url = await getProcessStandardImagePreviewUrl(filePath)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`工艺图示下载失败（${response.status}）`)
  }

  return {
    fileName,
    extension: getFileExtension(fileName, mimeType),
    mimeType,
    data: await response.arrayBuffer(),
  }
}
