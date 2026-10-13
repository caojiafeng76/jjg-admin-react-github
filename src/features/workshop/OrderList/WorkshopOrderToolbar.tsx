import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/16/solid'
import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import PrintButton from '@/ui/PrintButton'
import type { WorkshopOrderStatus } from './orderStatus'

export interface WorkshopOrderToolbarProps {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageStatus: boolean
  viewerDenied: boolean
  selectedCount: number
  isBatchUpdating: boolean
  isDeleting: boolean
  isPrinting: boolean
  isExporting: boolean
  handleCreate: () => void
  handleEdit: () => void
  handleDelete: () => void | Promise<void>
  handleBatchStatusChange: (nextStatus: WorkshopOrderStatus) => void
  handlePrint: () => void | Promise<void>
  handleExportExcel: () => void | Promise<void>
  preloadWorkshopOrderPdf: () => void
  preloadExportAsExcel: () => void
}

export default function WorkshopOrderToolbar({
  canCreate,
  canEdit,
  canDelete,
  canManageStatus,
  viewerDenied,
  selectedCount,
  isBatchUpdating,
  isDeleting,
  isPrinting,
  isExporting,
  handleCreate,
  handleEdit,
  handleDelete,
  handleBatchStatusChange,
  handlePrint,
  handleExportExcel,
  preloadWorkshopOrderPdf,
  preloadExportAsExcel,
}: WorkshopOrderToolbarProps) {
  return (
    <div className="rounded-lg border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-center gap-3">
        {/* 核心操作按钮组 */}
        <div className="flex items-center gap-2">
          {canCreate ? (
            <AddButton
              handleCreate={handleCreate}
              permissionKey="feature:workshop-order.create"
            />
          ) : null}
          {canEdit ? (
            <EditButton
              title="编辑"
              handleEdit={handleEdit}
              permissionKey="feature:workshop-order.edit"
            />
          ) : null}
        </div>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

        {/* 状态管理按钮组 */}
        {canManageStatus ? (
          <div className="flex items-center gap-1">
            <Button
              type="text"
              icon={<ArrowPathIcon className="size-4" />}
              onClick={() => handleBatchStatusChange('生产中')}
              loading={isBatchUpdating}
              disabled={viewerDenied}
              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
            >
              批量改为生产中
            </Button>
            <Button
              type="text"
              icon={<CheckCircleIcon className="size-4" />}
              onClick={() => handleBatchStatusChange('已结案')}
              loading={isBatchUpdating}
              disabled={viewerDenied}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
            >
              批量结案
            </Button>
          </div>
        ) : null}

        {/* 分隔线 */}
        <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

        {/* 删除按钮 */}
        {canDelete ? (
          <DeleteButton
            onClick={handleDelete}
            isDeleting={isDeleting}
            count={selectedCount}
            permissionKey="feature:workshop-order.delete"
          />
        ) : null}

        {/* 分隔线 */}
        <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

        {/* 输出按钮组 */}
        <div className="flex items-center gap-1">
          <PrintButton
            handlePrint={handlePrint}
            loading={isPrinting}
            count={selectedCount}
            onPreload={preloadWorkshopOrderPdf}
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            onMouseEnter={preloadExportAsExcel}
            onFocus={preloadExportAsExcel}
            loading={isExporting}
            disabled={viewerDenied || selectedCount === 0}
            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          >
            导出Excel
            {selectedCount > 0 && (
              <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                {selectedCount}
              </span>
            )}
          </Button>
        </div>

        {/* 统计信息 */}
        {selectedCount > 0 && (
          <div className="ml-auto">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              已选 {selectedCount} 项
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
