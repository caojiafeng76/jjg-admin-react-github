import { Badge, Button } from 'antd'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import type { ProductionOrder } from '@/services/apiProductionOrders'

export interface ProductionOrderAdminToolbarProps {
  handleBatchAudit: (isAudited: boolean) => void
  handleCreate: () => void
  handleDelete: (ids?: string[]) => void
  handleEdit: (record?: ProductionOrder) => void
  handleExport: () => void | Promise<void>
  handleLockManagement: () => void
  handleNightSnackExport: () => void | Promise<void>
  isBatchUpdating: boolean
  isDeleting: boolean
  isExporting: boolean
  isNightSnackExporting: boolean
  onOpenPasswordModal: () => void
  preloadProductionOrderExcel: () => void
  preloadProductionOrderNightSnackExcel: () => void
  selectedRowKeys: React.Key[]
  total: number | undefined
}

export default function ProductionOrderAdminToolbar({
  handleBatchAudit,
  handleCreate,
  handleDelete,
  handleEdit,
  handleExport,
  handleLockManagement,
  handleNightSnackExport,
  isBatchUpdating,
  isDeleting,
  isExporting,
  isNightSnackExporting,
  onOpenPasswordModal,
  preloadProductionOrderExcel,
  preloadProductionOrderNightSnackExcel,
  selectedRowKeys,
  total,
}: ProductionOrderAdminToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1">
        <AddButton handleCreate={handleCreate} />
        <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <Button
          type="text"
          size="small"
          icon={
            <KeyIcon className="size-4 text-slate-500 dark:text-slate-400" />
          }
          onClick={onOpenPasswordModal}
          className="h-8 rounded-lg px-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          修改密码
        </Button>
        <Button
          type="text"
          size="small"
          icon={
            <LockClosedIcon className="size-4 text-slate-400 dark:text-slate-500" />
          }
          onClick={handleLockManagement}
          className="h-8 rounded-lg px-3 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          锁定
        </Button>
        <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <Badge status="success" />
        <Button
          type="text"
          size="small"
          icon={
            <ShieldCheckIcon className="size-4 text-emerald-500 dark:text-emerald-400" />
          }
          onClick={() => handleBatchAudit(true)}
          loading={isBatchUpdating}
          className="h-8 rounded-lg px-3 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
        >
          批量审核
        </Button>
        <Button
          type="text"
          size="small"
          icon={
            <ArrowPathIcon className="size-4 text-amber-500 dark:text-amber-400" />
          }
          onClick={() => handleBatchAudit(false)}
          loading={isBatchUpdating}
          className="h-8 rounded-lg px-3 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
        >
          批量反审核
        </Button>
        <EditButton title="编辑" handleEdit={() => handleEdit()} />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ExportButton
          handleExport={handleExport}
          disabled={selectedRowKeys.length === 0 && (total || 0) === 0}
          loading={isExporting}
          onPreload={preloadProductionOrderExcel}
        >
          {selectedRowKeys.length > 0
            ? `导出 (${selectedRowKeys.length})`
            : `导出${total ? ` (${total})` : ''}`}
        </ExportButton>
        <ExportButton
          handleExport={handleNightSnackExport}
          disabled={selectedRowKeys.length === 0 && (total || 0) === 0}
          loading={isNightSnackExporting}
          onPreload={preloadProductionOrderNightSnackExcel}
        >
          夜宵明细
        </ExportButton>
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={selectedRowKeys.length}
          itemName="工单"
        />
      </div>
    </div>
  )
}
