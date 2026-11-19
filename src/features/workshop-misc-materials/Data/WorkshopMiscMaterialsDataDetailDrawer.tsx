import type { FormInstance, TabsProps } from 'antd'
import type { WorkshopMiscMaterialsQuickInventory } from '../Stock/WorkshopMiscMaterialsStockForm'
import type { WorkshopMiscMaterialsData } from '@/services/apiWorkshopMiscMaterialsData'
import type { WorkshopMiscMaterialsInventoryFormValues } from '@/services/apiWorkshopMiscMaterialsInventory'
import type {
  WorkshopMiscMaterialsStockDirection,
  WorkshopMiscMaterialsStockFormValues,
} from '@/services/apiWorkshopMiscMaterialsStock'
import { Alert, App, Button, Descriptions, Drawer, Modal, Tabs, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { WORKSHOP_MISC_MATERIALS_STOCK_LABELS } from '@/services/apiWorkshopMiscMaterialsStock'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { feedbackText } from '@/utils/feedbackText'
import { formatQuantity, formatWorkshopMiscMaterialLabel } from '../display'
import { useUpdateWorkshopMiscMaterialsInventory } from '../Inventory/useWorkshopMiscMaterialsInventory'
import {
  WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY,
  WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY,
  WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import { useCreateWorkshopMiscMaterialsStock } from '../Stock/useWorkshopMiscMaterialsStock'
import WorkshopMiscMaterialsStockForm from '../Stock/WorkshopMiscMaterialsStockForm'
import WorkshopMiscMaterialsInventoryAdjustForm from '../WorkshopMiscMaterialsInventoryAdjustForm'
import { useWorkshopMiscMaterialsInventoryDetail } from './useWorkshopMiscMaterialsData'
import {
  WorkshopMiscMaterialsAdjustmentRecordsTab,
  WorkshopMiscMaterialsStockRecordsTab,
} from './WorkshopMiscMaterialsRecordsTabs'

export interface WorkshopMiscMaterialsDataDetailDrawerProps {
  open: boolean
  record: WorkshopMiscMaterialsData | null
  onClose: () => void
}

type QuickMode = WorkshopMiscMaterialsStockDirection | 'adjust' | null

export default function WorkshopMiscMaterialsDataDetailDrawer({
  open,
  record,
  onClose,
}: WorkshopMiscMaterialsDataDetailDrawerProps) {
  const { message } = App.useApp()
  const canViewInventory = usePermission(
    WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY,
  )
  const canStockIn = usePermission(WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canStockOut = usePermission(
    WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
  )
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [quickMode, setQuickMode] = useState<QuickMode>(null)
  const [stockFormRef, setStockFormRef]
    = useState<FormInstance<WorkshopMiscMaterialsStockFormValues> | null>(null)
  const [adjustFormRef, setAdjustFormRef]
    = useState<FormInstance<WorkshopMiscMaterialsInventoryFormValues> | null>(null)
  const [quickError, setQuickError] = useState<unknown>(null)

  const {
    data: inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useWorkshopMiscMaterialsInventoryDetail(record?.id)
  const createStockInMutation = useCreateWorkshopMiscMaterialsStock('in')
  const createStockOutMutation = useCreateWorkshopMiscMaterialsStock('out')
  const updateInventoryMutation = useUpdateWorkshopMiscMaterialsInventory()

  const quickInventory = useMemo<WorkshopMiscMaterialsQuickInventory | null>(() => {
    if (!inventory)
      return null
    return {
      id: inventory.id,
      label: `${formatWorkshopMiscMaterialLabel(inventory)}（库存 ${inventory.total_quantity}）`,
      raw_material_quantity: inventory.raw_material_quantity,
      semi_finished_quantity: inventory.semi_finished_quantity,
      finished_quantity: inventory.finished_quantity,
      total_quantity: inventory.total_quantity,
    }
  }, [inventory])

  const disabledTip = viewerDenied
    ? viewerOperationTip
    : !inventory
        ? '尚未产生库存记录，暂不能操作'
        : null
  const actionDisabled = viewerDenied || !inventory
  const stockOutDisabled = actionDisabled || (inventory?.total_quantity ?? 0) === 0
  const stockOutTip = disabledTip ?? ((inventory?.total_quantity ?? 0) === 0 ? '当前总库存为 0，暂不能出库' : null)

  const closeQuickModal = useCallback(() => {
    setQuickMode(null)
    setQuickError(null)
    stockFormRef?.resetFields()
    adjustFormRef?.resetFields()
  }, [adjustFormRef, stockFormRef])

  const handleClose = useCallback(() => {
    closeQuickModal()
    onClose()
  }, [closeQuickModal, onClose])

  const handleStockFinish = useCallback(
    async (values: WorkshopMiscMaterialsStockFormValues) => {
      if (quickMode !== 'in' && quickMode !== 'out')
        return
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }
      const mutation
        = quickMode === 'in' ? createStockInMutation : createStockOutMutation
      setQuickError(null)
      try {
        await mutation.mutateAsync(values)
        message.success(
          `${feedbackText.created(`材料${WORKSHOP_MISC_MATERIALS_STOCK_LABELS[quickMode]}`)}，库存已更新`,
        )
        closeQuickModal()
      }
      catch (error) {
        setQuickError(error)
      }
    },
    [
      closeQuickModal,
      createStockInMutation,
      createStockOutMutation,
      message,
      quickMode,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleAdjustFinish = useCallback(
    async (values: WorkshopMiscMaterialsInventoryFormValues) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }
      if (!inventory)
        return
      setQuickError(null)
      try {
        await updateInventoryMutation.mutateAsync({ id: inventory.id, values })
        message.success(feedbackText.updated('材料库存'))
        closeQuickModal()
      }
      catch (error) {
        setQuickError(error)
      }
    },
    [
      closeQuickModal,
      inventory,
      message,
      updateInventoryMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    if (!inventory)
      return []
    const items: NonNullable<TabsProps['items']> = []
    if (canStockIn) {
      items.push({
        key: 'stock-in',
        label: '入库记录',
        children: (
          <WorkshopMiscMaterialsStockRecordsTab
            direction="in"
            inventoryId={inventory.id}
          />
        ),
      })
    }
    if (canStockOut) {
      items.push({
        key: 'stock-out',
        label: '出库记录',
        children: (
          <WorkshopMiscMaterialsStockRecordsTab
            direction="out"
            inventoryId={inventory.id}
          />
        ),
      })
    }
    if (canViewInventory) {
      items.push({
        key: 'adjustments',
        label: '调整记录',
        children: (
          <WorkshopMiscMaterialsAdjustmentRecordsTab inventoryId={inventory.id} />
        ),
      })
    }
    return items
  }, [canStockIn, canStockOut, canViewInventory, inventory])

  const stockMode = quickMode === 'in' || quickMode === 'out' ? quickMode : null
  const stockMutationPending
    = stockMode === 'in'
      ? createStockInMutation.isPending
      : createStockOutMutation.isPending

  return (
    <Drawer
      title="材料详情"
      size={760}
      open={open}
      destroyOnHidden
      onClose={handleClose}
    >
      {record
        ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <Descriptions
                  size="small"
                  column={2}
                  items={[
                    { key: 'model', label: '型号', children: record.model },
                    {
                      key: 'customer_model',
                      label: '客户型号',
                      children: record.customer_model || '-',
                    },
                    {
                      key: 'specification',
                      label: '规格',
                      children: record.specification || '-',
                    },
                    {
                      key: 'category',
                      label: '类别',
                      children: record.category || '-',
                    },
                    {
                      key: 'remarks',
                      label: '备注',
                      span: 2,
                      children: record.remarks || '-',
                    },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  当前库存
                </div>
                {inventoryError
                  ? (
                      <Alert
                        type="error"
                        showIcon
                        title="获取材料库存失败"
                        action={(
                          <Button size="small" onClick={() => refetchInventory()}>
                            重试
                          </Button>
                        )}
                      />
                    )
                  : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="text-xs text-text-secondary">原材料数量</div>
                            <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                              {isInventoryLoading
                                ? '-'
                                : formatQuantity(inventory?.raw_material_quantity)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="text-xs text-text-secondary">半成品数量</div>
                            <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                              {isInventoryLoading
                                ? '-'
                                : formatQuantity(inventory?.semi_finished_quantity)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="text-xs text-text-secondary">成品数量</div>
                            <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                              {isInventoryLoading
                                ? '-'
                                : formatQuantity(inventory?.finished_quantity)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5">
                            <div className="text-xs text-primary">合计</div>
                            <div className="mt-1 text-xl font-bold text-primary tabular-nums">
                              {isInventoryLoading
                                ? '-'
                                : formatQuantity(inventory?.total_quantity)}
                            </div>
                          </div>
                        </div>

                        {inventory?.remarks
                          ? (
                              <div className="text-xs text-text-secondary">
                                库存备注：{inventory.remarks}
                              </div>
                            )
                          : null}

                        {!isInventoryLoading && !inventory
                          ? (
                              <div className="text-xs text-warning">
                                {canViewInventory || canStockIn || canStockOut
                                  ? '尚未产生库存记录，暂不能新建出入库单'
                                  : '无材料库存相关页面权限，暂不能查看库存'}
                              </div>
                            )
                          : null}
                      </div>
                    )}
              </div>

              {canStockIn || canStockOut || canViewInventory
                ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {canStockIn
                          ? (
                              <Tooltip title={disabledTip}>
                                <Button
                                  type="primary"
                                  disabled={actionDisabled}
                                  onClick={() => setQuickMode('in')}
                                >
                                  新建入库
                                </Button>
                              </Tooltip>
                            )
                          : null}
                        {canStockOut
                          ? (
                              <Tooltip title={stockOutTip}>
                                <Button
                                  disabled={stockOutDisabled}
                                  onClick={() => setQuickMode('out')}
                                >
                                  新建出库
                                </Button>
                              </Tooltip>
                            )
                          : null}
                        {canViewInventory
                          ? (
                              <Tooltip title={disabledTip}>
                                <Button
                                  disabled={actionDisabled}
                                  onClick={() => setQuickMode('adjust')}
                                >
                                  调整库存
                                </Button>
                              </Tooltip>
                            )
                          : null}
                      </div>
                      {canStockIn || canStockOut
                        ? (
                            <div className="text-xs text-text-secondary">
                              新建单据将直接更新库存；历史单据请前往材料入库 / 材料出库页面管理。
                            </div>
                          )
                        : null}
                    </div>
                  )
                : null}

              {tabItems.length > 0
                ? (
                    <Tabs
                      size="small"
                      defaultActiveKey={String(tabItems[0]?.key ?? '')}
                      items={tabItems}
                    />
                  )
                : (
                    <div className="text-xs text-text-secondary">
                      {inventory
                        ? '无材料入库 / 出库页面权限，暂不能查看出入库记录'
                        : '暂无出入库记录可查看'}
                    </div>
                  )}
            </div>
          )
        : null}

      <Modal
        title={
          stockMode
            ? `新建材料${WORKSHOP_MISC_MATERIALS_STOCK_LABELS[stockMode]}`
            : ''
        }
        width={720}
        open={Boolean(stockMode)}
        destroyOnHidden
        confirmLoading={stockMutationPending}
        okButtonProps={{ disabled: actionDisabled }}
        onOk={() => stockFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        {stockMode
          ? (
              <div className="space-y-4">
                <FormErrorAlert error={quickError} />
                <WorkshopMiscMaterialsStockForm
                  direction={stockMode}
                  onFinish={handleStockFinish}
                  setFormRef={setStockFormRef}
                  isSubmitting={stockMutationPending}
                  quickInventory={quickInventory}
                />
              </div>
            )
          : null}
      </Modal>

      <Modal
        title="调整材料库存"
        width={720}
        open={quickMode === 'adjust'}
        destroyOnHidden
        confirmLoading={updateInventoryMutation.isPending}
        okButtonProps={{ disabled: actionDisabled }}
        onOk={() => adjustFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        {inventory
          ? (
              <div className="space-y-4">
                <FormErrorAlert error={quickError} />
                <WorkshopMiscMaterialsInventoryAdjustForm
                  currentRaw={inventory.raw_material_quantity}
                  currentSemi={inventory.semi_finished_quantity}
                  currentFinished={inventory.finished_quantity}
                  initialRemarks={inventory.remarks}
                  onFinish={handleAdjustFinish}
                  setFormRef={setAdjustFormRef}
                  isSubmitting={updateInventoryMutation.isPending}
                />
              </div>
            )
          : null}
      </Modal>
    </Drawer>
  )
}
