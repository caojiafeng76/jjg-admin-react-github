import type { DrawingPreview } from './useSafePartDrawing'
import { Modal } from 'antd'

export interface SafePartDrawingPreviewModalProps {
  previewDrawing: DrawingPreview | null
  onClose: () => void
}

export default function SafePartDrawingPreviewModal({
  previewDrawing,
  onClose,
}: SafePartDrawingPreviewModalProps) {
  return (
    <Modal
      title={previewDrawing?.fileName ?? '图纸预览'}
      open={Boolean(previewDrawing)}
      footer={null}
      width="80vw"
      destroyOnHidden
      onCancel={onClose}
    >
      {previewDrawing?.mimeType?.startsWith('image/')
        ? (
            <div className="flex max-h-[70vh] justify-center overflow-auto rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <img
                src={previewDrawing.url}
                alt={previewDrawing.fileName}
                className="max-h-[66vh] max-w-full object-contain"
              />
            </div>
          )
        : (
            <iframe
              title={previewDrawing?.fileName ?? '图纸预览'}
              src={previewDrawing?.url}
              className="h-[70vh] w-full rounded border border-slate-200 dark:border-slate-700"
            />
          )}
    </Modal>
  )
}
