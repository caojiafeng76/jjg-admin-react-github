import type { FormInstance, TabsProps } from 'antd'
import type { YoumaiFinishedGoodsInventoryAdjustFormValues } from './YoumaiFinishedGoodsInventoryAdjustForm'
import type { YoumaiFinishedGoodsStockInFormValues } from '@/services/apiYoumaiFinishedGoodsStockIn'
import type { YoumaiProductDataOption } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { Alert, App, Button, Drawer, Modal, Tabs, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { formatNumber } from '@/utils/format'
import { useAdjustYoumaiFinishedGoodsInventory } from '../FinishedGoodsInventory/useYoumaiFinishedGoodsInventory'
import { useCreateYoumaiFinishedGoodsStockIn } from '../FinishedGoodsStockIn/useYoumaiFinishedGoodsStockIn'
import YoumaiFinishedGoodsStockInForm from '../FinishedGoodsStockIn/YoumaiFinishedGoodsStockInForm'
import {
  YOUMAI_FINISHED_GOODS_INVENTORY_PERMISSION_KEY,
  YOUMAI_FINISHED_GOODS_STOCK_IN_PERMISSION_KEY,
  YOUMAI_FINISHED_GOODS_STOCK_OUT_PERMISSION_KEY,
  YOUMAI_MANAGE_PERMISSION_KEY,
} from '../permissions'
import { useYoumaiFinishedGoodsInventoryDetail } from './useYoumaiFinishedGoodsDetail'
import YoumaiFinishedGoodsInventoryAdjustForm from './YoumaiFinishedGoodsInventoryAdjustForm'
import {
  YoumaiFinishedGoodsAdjustmentRecordsTab,
  YoumaiFinishedGoodsStockInRecordsTab,
  YoumaiFinishedGoodsStockOutRecordsTab,
} from './YoumaiFinishedGoodsRecordsTabs'

export interface YoumaiFinishedGoodsStockDetailDrawerProps {
  open: boolean
  product: YoumaiProductDataOption | null
  onClose: () => void
}

function getFinalStockColorClass(value: number) {
  if (value < 20)
    return 'text-red-600 dark:text-red-400'
  if (value < 50)
    return 'text-yellow-600 dark:text-yellow-400'
  if (value < 100)
    return 'text-orange-600 dark:text-orange-400'
  return 'text-green-600 dark:text-green-400'
}

export default function YoumaiFinishedGoodsStockDetailDrawer({
  open,
  product,
  onClose,
}: YoumaiFinishedGoodsStockDetailDrawerProps) {
  const { message } = App.useApp()
  const canViewInventory = usePermission(
    YOUMAI_FINISHED_GOODS_INVENTORY_PERMISSION_KEY,
  )
  const canViewStockIn = usePermission(
    YOUMAI_FINISHED_GOODS_STOCK_IN_PERMISSION_KEY,
  )
  const canViewStockOut = usePermission(
    YOUMAI_FINISHED_GOODS_STOCK_OUT_PERMISSION_KEY,
  )
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: YOUMAI_MANAGE_PERMISSION_KEY,
  })

  const [quickMode, setQuickMode] = useState<'stock-in' | 'adjust' | null>(null)
  const [stockInFormRef, setStockInFormRef]
    = useState<FormInstance<YoumaiFinishedGoodsStockInFormValues> | null>(null)
  const [adjustFormRef, setAdjustFormRef]
    = useState<FormInstance<YoumaiFinishedGoodsInventoryAdjustFormValues> | null>(
      null,
    )
  const [quickError, setQuickError] = useState<unknown>(null)

  const {
    data: inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useYoumaiFinishedGoodsInventoryDetail(product?.id)
  const createStockInMutation = useCreateYoumaiFinishedGoodsStockIn()
  const adjustInventoryMutation = useAdjustYoumaiFinishedGoodsInventory()

  const stockInDisabled = viewerDenied || !canViewStockIn || !product
  const stockInTip = viewerDenied
    ? viewerOperationTip
    : !canViewStockIn
        ? '无优迈成品入库页面权限'
        : null

  const adjustDisabled = viewerDenied || !canViewInventory || !inventory
  const adjustTip = viewerDenied
    ? viewerOperationTip
    : !canViewInventory
        ? '无优迈成品库存页面权限'
        : !inventory
            ? '尚未产生库存记录，暂不能调整'
            : null

  const closeQuickModal = useCallback(() => {
    setQuickMode(null)
    setQuickError(null)
    stockInFormRef?.resetFields()
    adjustFormRef?.resetFields()
  }, [adjustFormRef, stockInFormRef])

  const handleClose = useCallback(() => {
    closeQuickModal()
    onClose()
  }, [closeQuickModal, onClose])

  const handleQuickStockInFinish = useCallback(
    async (values: YoumaiFinishedGoodsStockInFormValues) => {
      if (!canViewStockIn) {
        message.warning('无优迈成品入库页面权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setQuickError(null)
      try {
        await createStockInMutation.mutateAsync(values)
        message.success(
          values.status === '已审核'
            ? '优迈成品入库创建成功，现有库存已更新'
            : '优迈成品入库创建成功，当前为待审核',
        )
        closeQuickModal()
      }
      catch (error) {
        setQuickError(error)
      }
    },
    [
      canViewStockIn,
      closeQuickModal,
      createStockInMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleAdjustFinish = useCallback(
    async (values: YoumaiFinishedGoodsInventoryAdjustFormValues) => {
      if (!canViewInventory) {
        message.warning('无优迈成品库存页面权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!inventory) {
        return
      }

      setQuickError(null)
      try {
        await adjustInventoryMutation.mutateAsync({
          id: inventory.id,
          current_stock: values.current_stock,
          remarks: values.remarks ?? '',
        })
        message.success('优迈成品库存调整成功')
        closeQuickModal()
      }
      catch (error) {
        setQuickError(error)
      }
    },
    [
      adjustInventoryMutation,
      canViewInventory,
      closeQuickModal,
      inventory,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    if (!product)
      return []

    const items: NonNullable<TabsProps['items']> = []

    if (canViewStockIn) {
      items.push({
        key: 'stock-in',
        label: '入库记录',
        children: (
          <YoumaiFinishedGoodsStockInRecordsTab productDataId={product.id} />
        ),
      })
    }

    if (canViewStockOut) {
      items.push({
        key: 'stock-out',
        label: '出库记录',
        children: (
          <YoumaiFinishedGoodsStockOutRecordsTab productDataId={product.id} />
        ),
      })
    }

    if (canViewInventory || canViewStockOut) {
      items.push({
        key: 'adjustments',
        label: '调整记录',
        children: (
          <YoumaiFinishedGoodsAdjustmentRecordsTab productDataId={product.id} />
        ),
      })
    }

    return items
  }, [canViewInventory, canViewStockIn, canViewStockOut, product])

  const stats = useMemo(
    () => [
      {
        label: '待入库',
        value: Number(inventory?.pending_stock_in ?? 0),
        muted: true,
      },
      {
        label: '现有库存',
        value: Number(inventory?.current_stock ?? 0),
      },
      {
        label: '待出库',
        value: Number(inventory?.pending_stock_out ?? 0),
        muted: true,
      },
      {
        label: '最终库存',
        value: Number(inventory?.final_stock ?? 0),
        highlight: true,
      },
    ],
    [inventory],
  )

  return (
    <Drawer
      title="优迈成品库存与流水"
      size={880}
      open={open}
      destroyOnHidden
      onClose={handleClose}
    >
      {product
        ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {product.material_code} | {product.material_name}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-3 dark:text-slate-300">
                  <div>型号：{product.model || '-'}</div>
                  <div>规格：{product.specification || '-'}</div>
                  <div>比重：{formatNumber(product.specific_gravity, 3)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  库存概览
                </div>
                {inventoryError
                  ? (
                      <Alert
                        type="error"
                        showIcon
                        title="获取优迈成品库存失败"
                        action={(
                          <Button size="small" onClick={() => refetchInventory()}>
                            重试
                          </Button>
                        )}
                      />
                    )
                  : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {stats.map(stat => (
                            <div
                              key={stat.label}
                              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
                            >
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                {stat.label}
                              </div>
                              <div
                                className={[
                                  'mt-1 text-lg font-medium tabular-nums',
                                  stat.highlight
                                    ? getFinalStockColorClass(stat.value)
                                    : stat.muted
                                      ? 'text-slate-400 dark:text-slate-500'
                                      : 'text-slate-800 dark:text-slate-100',
                                ].join(' ')}
                              >
                                {isInventoryLoading
                                  ? '-'
                                  : Number.isInteger(stat.value)
                                    ? formatNumber(stat.value, 0)
                                    : formatNumber(stat.value, 3)}
                              </div>
                            </div>
                          ))}
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
                                尚未产生库存记录，暂不能调整库存；新建入库单后将自动建立库存行。
                              </div>
                            )
                          : null}
                      </div>
                    )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Tooltip title={stockInTip}>
                    <Button
                      type="primary"
                      disabled={stockInDisabled}
                      onClick={() => {
                        setQuickError(null)
                        setQuickMode('stock-in')
                      }}
                    >
                      新建入库
                    </Button>
                  </Tooltip>
                  <Tooltip title={adjustTip}>
                    <Button
                      disabled={adjustDisabled}
                      onClick={() => {
                        setQuickError(null)
                        setQuickMode('adjust')
                      }}
                    >
                      调整库存
                    </Button>
                  </Tooltip>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  「新建入库」支持直接选择已审核以立即增加现有库存；「调整库存」将直接修改现有库存并记入调整记录。
                </div>
              </div>

              {tabItems.length > 0
                ? (
                    <Tabs
                      defaultActiveKey={String(tabItems[0]?.key ?? '')}
                      items={tabItems}
                    />
                  )
                : (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      无相关流水查看权限
                    </div>
                  )}
            </div>
          )
        : null}

      <Modal
        title="新建优迈成品入库"
        open={quickMode === 'stock-in'}
        destroyOnHidden
        confirmLoading={createStockInMutation.isPending}
        okButtonProps={{ disabled: stockInDisabled }}
        onOk={() => stockInFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        <div className="space-y-4">
          <FormErrorAlert error={quickError} />
          <YoumaiFinishedGoodsStockInForm
            onFinish={handleQuickStockInFinish}
            setFormRef={setStockInFormRef}
            isSubmitting={createStockInMutation.isPending}
            lockedProduct={product}
            allowStatusSelect
          />
        </div>
      </Modal>

      <Modal
        title="调整优迈成品库存"
        open={quickMode === 'adjust'}
        destroyOnHidden
        confirmLoading={adjustInventoryMutation.isPending}
        okButtonProps={{ disabled: adjustDisabled }}
        onOk={() => adjustFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        {inventory
          ? (
              <div className="space-y-4">
                <FormErrorAlert error={quickError} />
                <YoumaiFinishedGoodsInventoryAdjustForm
                  currentStock={Number(inventory.current_stock ?? 0)}
                  initialRemarks={inventory.remarks}
                  onFinish={handleAdjustFinish}
                  setFormRef={setAdjustFormRef}
                  isSubmitting={adjustInventoryMutation.isPending}
                />
              </div>
            )
          : null}
      </Modal>
    </Drawer>
  )
}
