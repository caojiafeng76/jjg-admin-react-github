import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Drawer,
  Modal,
  Tabs,
  Tooltip,
  type FormInstance,
  type TabsProps,
} from 'antd'

import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type { JintanMaterialsData } from '@/services/apiJintanMaterialsData'
import type { JintanMaterialsStockInFormValues } from '@/services/apiJintanMaterialsStockIn'
import type { JintanMaterialsStockOutFormValues } from '@/services/apiJintanMaterialsStockOut'
import {
  JINTAN_MATERIALS_DATA_PERMISSION_KEY,
  JINTAN_MATERIALS_INVENTORY_PERMISSION_KEY,
  JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY,
  JINTAN_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import { useCreateJintanMaterialsStockIn } from '../MaterialsStockIn/useJintanMaterialsStockIn'
import JintanMaterialsStockInForm, {
  type JintanMaterialsQuickInventory,
} from '../MaterialsStockIn/JintanMaterialsStockInForm'
import { useCreateJintanMaterialsStockOut } from '../MaterialsStockOut/useJintanMaterialsStockOut'
import JintanMaterialsStockOutForm from '../MaterialsStockOut/JintanMaterialsStockOutForm'
import {
  JintanMaterialsStockInRecordsTab,
  JintanMaterialsStockOutRecordsTab,
} from './JintanMaterialsStockRecordsTabs'
import { useJintanMaterialsInventoryDetail } from './useJintanMaterialsDataDetail'

interface Props {
  open: boolean
  record: JintanMaterialsData | null
  onClose: () => void
}

export default function JintanMaterialsDataDetailDrawer({
  open,
  record,
  onClose,
}: Props) {
  const { message } = App.useApp()
  const canManageMaterials = usePermission(JINTAN_MATERIALS_DATA_PERMISSION_KEY)
  const canViewInventory = usePermission(
    JINTAN_MATERIALS_INVENTORY_PERMISSION_KEY,
  )
  const canViewStockIn = usePermission(JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canViewStockOut = usePermission(
    JINTAN_MATERIALS_STOCK_OUT_PERMISSION_KEY,
  )
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [quickMode, setQuickMode] = useState<'stock-in' | 'stock-out' | null>(
    null,
  )
  const [stockInFormRef, setStockInFormRef] =
    useState<FormInstance<JintanMaterialsStockInFormValues> | null>(null)
  const [stockOutFormRef, setStockOutFormRef] =
    useState<FormInstance<JintanMaterialsStockOutFormValues> | null>(null)

  const {
    data: inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useJintanMaterialsInventoryDetail(record?.id)
  const createStockInMutation = useCreateJintanMaterialsStockIn()
  const createStockOutMutation = useCreateJintanMaterialsStockOut()

  const quickInventory = useMemo<JintanMaterialsQuickInventory | null>(() => {
    if (!inventory) return null

    return {
      id: inventory.id,
      label: `${inventory.material_model ? `${inventory.material_model} / ` : ''}${inventory.material_name} / ${inventory.specification || '无规格'}（库存 ${inventory.quantity}）`,
      quantity: inventory.quantity,
    }
  }, [inventory])

  const quickCreateDisabled =
    viewerDenied || !canManageMaterials || !quickInventory
  const quickCreateTip = viewerDenied
    ? viewerOperationTip
    : !canManageMaterials
      ? '无金檀木业模块操作权限'
      : !quickInventory
        ? '尚未产生库存记录，暂不能建单'
        : null

  const closeQuickModal = useCallback(() => {
    setQuickMode(null)
    stockInFormRef?.resetFields()
    stockOutFormRef?.resetFields()
  }, [stockInFormRef, stockOutFormRef])

  const handleClose = useCallback(() => {
    closeQuickModal()
    onClose()
  }, [closeQuickModal, onClose])

  const handleQuickStockInFinish = useCallback(
    async (values: JintanMaterialsStockInFormValues) => {
      if (!canManageMaterials) {
        message.warning('无金檀木业模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await createStockInMutation.mutateAsync(values)
        message.success('素材入库创建成功，库存已更新')
        closeQuickModal()
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '创建素材入库失败，请稍后重试',
        )
      }
    },
    [
      canManageMaterials,
      closeQuickModal,
      createStockInMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleQuickStockOutFinish = useCallback(
    async (values: JintanMaterialsStockOutFormValues) => {
      if (!canManageMaterials) {
        message.warning('无金檀木业模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await createStockOutMutation.mutateAsync(values)
        message.success('素材出库创建成功，库存已更新')
        closeQuickModal()
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '创建素材出库失败，请稍后重试',
        )
      }
    },
    [
      canManageMaterials,
      closeQuickModal,
      createStockOutMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    if (!inventory) return []

    const items: NonNullable<TabsProps['items']> = []

    if (canViewStockIn) {
      items.push({
        key: 'stock-in',
        label: '入库记录',
        children: (
          <JintanMaterialsStockInRecordsTab inventoryId={inventory.id} />
        ),
      })
    }

    if (canViewStockOut) {
      items.push({
        key: 'stock-out',
        label: '出库记录',
        children: (
          <JintanMaterialsStockOutRecordsTab inventoryId={inventory.id} />
        ),
      })
    }

    return items
  }, [canViewStockIn, canViewStockOut, inventory])

  const canQuickCreate = canViewStockIn || canViewStockOut

  return (
    <Drawer
      title="素材详情"
      size={880}
      open={open}
      destroyOnHidden
      onClose={handleClose}
    >
      {record ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="text-base font-medium text-slate-900 dark:text-slate-100">
              {record.material_model ? `${record.material_model} / ` : ''}
              {record.material_name} / {record.specification || '无规格'}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-3 dark:text-slate-300">
              <div>材质：{record.material || '-'}</div>
              <div className="col-span-2">备注：{record.remarks || '-'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              库存
            </div>
            {canViewInventory ? (
              inventoryError ? (
                <Alert
                  type="error"
                  showIcon
                  title="获取素材库存失败"
                  action={
                    <Button size="small" onClick={() => refetchInventory()}>
                      重试
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        当前库存
                      </div>
                      <div className="mt-1 text-lg font-medium text-slate-800 tabular-nums dark:text-slate-100">
                        {isInventoryLoading
                          ? '-'
                          : Number(inventory?.quantity ?? 0).toLocaleString(
                              'zh-CN',
                            )}
                      </div>
                    </div>
                  </div>
                  {inventory?.remarks ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      库存备注：{inventory.remarks}
                    </div>
                  ) : null}
                  {!isInventoryLoading && !inventory ? (
                    <div className="text-xs text-amber-600 dark:text-amber-500">
                      尚未产生库存记录，暂不能新建出入库单
                    </div>
                  ) : null}
                </div>
              )
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500">
                无素材库存页面权限，暂不能查看库存
              </div>
            )}
          </div>

          {canQuickCreate ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {canViewStockIn ? (
                  <Tooltip title={quickCreateTip}>
                    <Button
                      type="primary"
                      disabled={quickCreateDisabled}
                      onClick={() => setQuickMode('stock-in')}
                    >
                      新建入库
                    </Button>
                  </Tooltip>
                ) : null}
                {canViewStockOut ? (
                  <Tooltip title={quickCreateTip}>
                    <Button
                      disabled={quickCreateDisabled}
                      onClick={() => setQuickMode('stock-out')}
                    >
                      新建出库
                    </Button>
                  </Tooltip>
                ) : null}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                新建单据将直接更新库存；历史单据请前往素材入库 /
                素材出库页面管理。
              </div>
            </div>
          ) : null}

          {tabItems.length > 0 ? (
            <Tabs
              defaultActiveKey={String(tabItems[0]?.key ?? '')}
              items={tabItems}
            />
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {inventory
                ? '无素材入库 / 出库页面权限，暂不能查看出入库记录'
                : '暂无出入库记录可查看'}
            </div>
          )}
        </div>
      ) : null}

      <Modal
        title="新建素材入库"
        open={quickMode === 'stock-in'}
        destroyOnHidden
        confirmLoading={createStockInMutation.isPending}
        okButtonProps={{ disabled: quickCreateDisabled }}
        onOk={() => stockInFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        <JintanMaterialsStockInForm
          onFinish={handleQuickStockInFinish}
          setFormRef={setStockInFormRef}
          isSubmitting={createStockInMutation.isPending}
          quickInventory={quickInventory}
        />
      </Modal>

      <Modal
        title="新建素材出库"
        open={quickMode === 'stock-out'}
        destroyOnHidden
        confirmLoading={createStockOutMutation.isPending}
        okButtonProps={{ disabled: quickCreateDisabled }}
        onOk={() => stockOutFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        <JintanMaterialsStockOutForm
          onFinish={handleQuickStockOutFinish}
          setFormRef={setStockOutFormRef}
          isSubmitting={createStockOutMutation.isPending}
          quickInventory={quickInventory}
        />
      </Modal>
    </Drawer>
  )
}
