import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { buildSketchPath } from './apiWorkshopOrdersCalculations'

const WORKSHOP_ORDER_SKETCH_BUCKET = 'workshop-order-sketches'

export async function removeWorkshopOrderSketchFiles(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))
  if (uniquePaths.length === 0) return

  const { error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .remove(uniquePaths)

  if (error) {
    console.warn('订单简图删除失败:', error)
  }
}

export async function uploadWorkshopOrderSketch(
  row: WorkshopOrder,
  index: number,
): Promise<{ path: string | null; uploadedPath: string | null }> {
  const sketchFile = row.sketch_file
  if (!sketchFile) {
    return { path: row.sketch_file_path ?? null, uploadedPath: null }
  }

  const filePath = buildSketchPath(row, index)
  const { error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .upload(
      filePath,
      new Blob([sketchFile.data], { type: sketchFile.mimeType }),
      {
        contentType: sketchFile.mimeType,
        upsert: false,
      },
    )

  if (error) {
    throw handleApiError(error, '订单简图上传失败')
  }

  return { path: filePath, uploadedPath: filePath }
}

export async function downloadWorkshopOrderSketchFile(filePath: string) {
  const { data, error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .download(filePath)

  if (error) {
    throw handleApiError(error, '订单简图下载失败')
  }

  return data.arrayBuffer()
}
