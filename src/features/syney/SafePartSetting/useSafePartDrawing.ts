import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import {
  getSyneySafePartDrawingDownloadUrl,
  getSyneySafePartDrawingPreviewUrl,
  uploadSyneySafePartDrawing,
} from '@services/apiSyneySafePartSettings'
import { App } from 'antd'
import { useCallback, useState } from 'react'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyKeys } from '../queryKeys'

export interface DrawingPreview {
  url: string
  fileName: string
  mimeType: string | null
}

/** 件号图纸的上传、预览与下载，以及各操作按行的 loading 状态 */
export function useSafePartDrawing() {
  const { message } = App.useApp()
  const [previewDrawing, setPreviewDrawing] = useState<DrawingPreview | null>(
    null,
  )
  const [uploadingDrawingId, setUploadingDrawingId] = useState<string | null>(
    null,
  )
  const [previewingDrawingId, setPreviewingDrawingId] = useState<string | null>(
    null,
  )
  const [downloadingDrawingId, setDownloadingDrawingId] = useState<
    string | null
  >(null)

  const drawingUploadMutation = useMutationWithInvalidation({
    mutationFn: uploadSyneySafePartDrawing,
    invalidateQueries: [syneyKeys.safePartSettings.all],
  })

  const handleDrawingUpload = useCallback(
    async (record: SyneySafePartSetting, file: File) => {
      setUploadingDrawingId(record.id)

      try {
        await drawingUploadMutation.mutateAsync({ setting: record, file })
        message.success('图纸上传成功')
      }
      catch (error) {
        message.error(getUserErrorMessage(error, feedbackText.failed('上传', '图纸')))
      }
      finally {
        setUploadingDrawingId(null)
      }
    },
    [drawingUploadMutation, message],
  )

  const handlePreviewDrawing = useCallback(
    async (record: SyneySafePartSetting) => {
      if (!record.drawing_file_path) {
        message.warning('暂无图纸')
        return
      }

      setPreviewingDrawingId(record.id)

      try {
        const url = await getSyneySafePartDrawingPreviewUrl(
          record.drawing_file_path,
        )
        setPreviewDrawing({
          url,
          fileName: record.drawing_file_name ?? '图纸预览',
          mimeType: record.drawing_file_mime_type,
        })
      }
      catch (error) {
        message.error(getUserErrorMessage(error, feedbackText.failed('预览', '图纸')))
      }
      finally {
        setPreviewingDrawingId(null)
      }
    },
    [message],
  )

  const handleDownloadDrawing = useCallback(
    async (record: SyneySafePartSetting) => {
      if (!record.drawing_file_path) {
        message.warning('暂无图纸')
        return
      }

      setDownloadingDrawingId(record.id)

      try {
        const fileName = record.drawing_file_name ?? `${record.part_no}-图纸`
        const url = await getSyneySafePartDrawingDownloadUrl({
          filePath: record.drawing_file_path,
          fileName,
        })
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      catch (error) {
        message.error(getUserErrorMessage(error, feedbackText.failed('下载', '图纸')))
      }
      finally {
        setDownloadingDrawingId(null)
      }
    },
    [message],
  )

  return {
    previewDrawing,
    closePreview: () => setPreviewDrawing(null),
    uploadingDrawingId,
    previewingDrawingId,
    downloadingDrawingId,
    handleDrawingUpload,
    handlePreviewDrawing,
    handleDownloadDrawing,
  }
}
