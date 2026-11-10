import type { FormInstance, TabsProps } from 'antd'
import type { SyneyMaterialsQuickInventory } from '../Stock/SyneyMaterialsStockForm'
import type { JintanInventoryAdjustFormValues } from '@/features/jintan/JintanInventoryAdjustForm'
import type { SyneyMaterialsData } from '@/services/apiSyneyMaterialsData'
import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockFormValues,
} from '@/services/apiSyneyMaterialsStock'
import { Alert, App, Button, Drawer, Modal, Tabs, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import JintanInventoryAdjustForm from '@/features/jintan/JintanInventoryAdjustForm'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { feedbackText } from '@/utils/feedbackText'
import { formatSyneyMaterialLabel } from '../display'
import { useUpdateSyneyMaterialsInventory } from '../Inventory/useSyneyMaterialsInventory'
import {
  SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import SyneyMaterialsStockForm from '../Stock/SyneyMaterialsStockForm'
import { useCreateSyneyMaterialsStock } from '../Stock/useSyneyMaterialsStock'
import {
  SyneyMaterialsAdjustmentRecordsTab,
  SyneyMaterialsStockRecordsTab,
} from './SyneyMaterialsRecordsTabs'
import { useSyneyMaterialsInventoryDetail } from './useSyneyMaterialsData'

export interface SyneyMaterialsDataDetailDrawerProps {
  open: boolean
  record: SyneyMaterialsData | null
  onClose: () => void
}

type QuickMode = SyneyMaterialsStockDirection | 'adjust' | null

export default function SyneyMaterialsDataDetailDrawer({
  open,
  record,
  onClose,
}: SyneyMaterialsDataDetailDrawerProps) {
  const { message } = App.useApp()
  const canViewInventory = usePermission(SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY)
  const canStockIn = usePermission(SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canStockOut = usePermission(SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [quickMode, setQuickMode] = useState<QuickMode>(null)
  const [stockFormRef, setStockFormRef]
    = useState<FormInstance<SyneyMaterialsStockFormValues> | null>(null)
  const [adjustFormRef, setAdjustFormRef]
    = useState<FormInstance<JintanInventoryAdjustFormValues> | null>(null)
  const [quickError, setQuickError] = useState<unknown>(null)

  const {
    data: inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useSyneyMaterialsInventoryDetail(record?.id)
  const createStockInMutation = useCreateSyneyMaterialsStock('in')
  const createStockOutMutation = useCreateSyneyMaterialsStock('out')
  const updateInventoryMutation = useUpdateSyneyMaterialsInventory()

  const quickInventory = useMemo<SyneyMaterialsQuickInventory | null>(() => {
    if (!inventory)
      return null
    return {
      id: inventory.id,
      label: `${formatSyneyMaterialLabel(inventory)}（库存 ${inventory.quantity}）`,
      quantity: inventory.quantity,
    }
  }, [inventory])

  const disabledTip = viewerDenied
    ? viewerOperationTip
    : !inventory
        ? '尚未产生库存记录，暂不能操作'
        : null
  const actionDisabled = viewerDenied || !inventory

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
    async (values: SyneyMaterialsStockFormValues) => {
      if (quickMode !== 'in' && quickMode !== 'out')
        return
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }
      const mutation = quickMode === 'in' ? createStockInMutation : createStockOutMutation
      setQuickError(null)
      try {
        await mutation.mutateAsync(values)
        message.success(
          `${feedbackText.created(`材料${SYNEY_MATERIALS_STOCK_LABELS[quickMode]}`)}，库存已更新`,
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
    async (values: JintanInventoryAdjustFormValues) => {
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
    [closeQuickModal, inventory, message, updateInventoryMutation, viewerDenied, viewerOperationTip],
  )

  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    if (!inventory)
      return []
    const items: NonNullable<TabsProps['items']> = []
    if (canStockIn) {
      items.push({
        key: 'stock-in',
        label: '入库记录',
        children: <SyneyMaterialsStockRecordsTab direction="in" inventoryId={inventory.id} />,
      })
    }
    if (canStockOut) {
      items.push({
        key: 'stock-out',
        label: '出库记录',
        children: <SyneyMaterialsStockRecordsTab direction="out" inventoryId={inventory.id} />,
      })
    }
    if (canViewInventory) {
      items.push({
        key: 'adjustments',
        label: '调整记录',
        children: <SyneyMaterialsAdjustmentRecordsTab inventoryId={inventory.id} />,
      })
    }
    return items
  }, [canStockIn, canStockOut, canViewInventory, inventory])

  const stockMode = quickMode === 'in' || quickMode === 'out' ? quickMode : null
  const stockMutationPending = stockMode === 'in'
    ? createStockInMutation.isPending
    : createStockOutMutation.isPending

  return (
    <Drawer
      title="材料详情"
      size={820}
      open={open}
      destroyOnHidden
      onClose={handleClose}
    >
      {record
        ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {record.material_name} / {record.specification || '无规格'}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-3 dark:text-slate-300">
                  <div>单位：{record.unit || '-'}</div>
                  <div className="col-span-2">备注：{record.remarks || '-'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  库存
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
                        <div className="w-1/2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            当前库存
                          </div>
                          <div className="mt-1 text-lg font-medium text-slate-800 tabular-nums dark:text-slate-100">
                            {isInventoryLoading
                              ? '-'
                              : `${Number(inventory?.quantity ?? 0).toLocaleString('zh-CN')} ${record.unit}`}
                          </div>
                        </div>
                        {inventory?.remarks
                          ? (
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                库存备注：{inventory.remarks}
                              </div>
                            )
                          : null}
                        {!isInventoryLoading && !inventory
                          ? (
                              <div className="text-xs text-amber-600 dark:text-amber-500">
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
                              <Tooltip title={disabledTip}>
                                <Button
                                  disabled={actionDisabled}
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
                            <div className="text-xs text-slate-400 dark:text-slate-500">
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
                      defaultActiveKey={String(tabItems[0]?.key ?? '')}
                      items={tabItems}
                    />
                  )
                : (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {inventory
                        ? '无材料入库 / 出库页面权限，暂不能查看出入库记录'
                        : '暂无出入库记录可查看'}
                    </div>
                  )}
            </div>
          )
        : null}

      <Modal
        title={stockMode ? `新建材料${SYNEY_MATERIALS_STOCK_LABELS[stockMode]}` : ''}
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
                <SyneyMaterialsStockForm
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
                <JintanInventoryAdjustForm
                  currentQuantity={inventory.quantity}
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
