import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import {
  getSyneySafePartDrawingDownloadUrl,
  getSyneySafePartDrawingPreviewUrl,
  uploadSyneySafePartDrawing,
} from '@services/apiSyneySafePartSettings'
import { App } from 'antd'
import { useCallback, useState } from 'react'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { SYNEY_SAFE_PART_SETTINGS_KEY } from '../useSyneySafePartSettings'

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

  const drawingUploadMutation = useMutationWithMessage({
    mutationFn: uploadSyneySafePartDrawing,
    invalidateQueries: [[SYNEY_SAFE_PART_SETTINGS_KEY]],
    successMessage: '图纸上传成功',
    messageApi: message,
  })

  const handleDrawingUpload = useCallback(
    async (record: SyneySafePartSetting, file: File) => {
      setUploadingDrawingId(record.id)

      try {
        await drawingUploadMutation.mutateAsync({ setting: record, file })
      }
      catch {
        // 错误消息已由 useMutationWithMessage 统一提示
      }
      finally {
        setUploadingDrawingId(null)
      }
    },
    [drawingUploadMutation],
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
