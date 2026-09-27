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
import dayjs from 'dayjs'

import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type { ToolingData } from '@/services/apiToolingData'
import type { ToolingStockInFormValues } from '@/services/apiToolingStockIn'
import type { ToolingStockOutFormValues } from '@/services/apiToolingStockOut'
import { formatNumber } from '@/utils/format'
import { getFinalStockColorClass } from '../inventoryPresentation'
import {
  TOOLING_INVENTORY_PAGE_PERMISSION_KEY,
  TOOLING_MANAGE_PERMISSION_KEY,
  TOOLING_STOCK_IN_PAGE_PERMISSION_KEY,
  TOOLING_STOCK_OUT_PAGE_PERMISSION_KEY,
} from '../permissions'
import type { RemoteToolingOption } from '../remoteToolingOptions'
import ToolingStockInForm from '../ToolingStockIn/ToolingStockInForm'
import { useCreateToolingStockIn } from '../ToolingStockIn/useToolingStockIn'
import ToolingStockOutForm from '../ToolingStockOut/ToolingStockOutForm'
import { useCreateToolingStockOut } from '../ToolingStockOut/useToolingStockOut'
import {
  ToolingStockInRecordsTab,
  ToolingStockOutRecordsTab,
} from './ToolingStockRecordsTabs'
import { useToolingInventoryDetail } from './useToolingDataDetail'

type QuickStockInInitialValues = ToolingStockInFormValues & RemoteToolingOption
type QuickStockOutInitialValues = ToolingStockOutFormValues &
  RemoteToolingOption

interface InventoryStat {
  label: string
  value: number
  muted?: boolean
  highlight?: boolean
}

function InventorySummary({ toolingDataId }: { toolingDataId: string }) {
  const { data, isLoading, error, refetch } =
    useToolingInventoryDetail(toolingDataId)

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title="获取刀具库存失败"
        action={
          <Button size="small" onClick={() => refetch()}>
            重试
          </Button>
        }
      />
    )
  }

  const stats: InventoryStat[] = [
    { label: '待入库', value: data?.pending_stock_in ?? 0, muted: true },
    { label: '现有库存', value: data?.current_stock ?? 0 },
    { label: '待出库', value: data?.pending_stock_out ?? 0, muted: true },
    { label: '最终库存', value: data?.final_stock ?? 0, highlight: true },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
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
              {isLoading ? '-' : formatNumber(stat.value)}
            </div>
          </div>
        ))}
      </div>
      {data?.remarks ? (
        <div className="text-xs text-slate-400 dark:text-slate-500">
          库存备注：{data.remarks}
        </div>
      ) : null}
      {!isLoading && !data ? (
        <div className="text-xs text-amber-600 dark:text-amber-500">
          尚未产生库存记录，入库/出库单保存后将自动建立库存行
        </div>
      ) : null}
    </div>
  )
}

interface Props {
  open: boolean
  record: ToolingData | null
  onClose: () => void
}

export default function ToolingDataDetailDrawer({
  open,
  record,
  onClose,
}: Props) {
  const { message } = App.useApp()
  const canManageTooling = usePermission(TOOLING_MANAGE_PERMISSION_KEY)
  const canViewInventory = usePermission(TOOLING_INVENTORY_PAGE_PERMISSION_KEY)
  const canViewStockIn = usePermission(TOOLING_STOCK_IN_PAGE_PERMISSION_KEY)
  const canViewStockOut = usePermission(TOOLING_STOCK_OUT_PAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: TOOLING_MANAGE_PERMISSION_KEY,
  })

  const [quickMode, setQuickMode] = useState<'stock-in' | 'stock-out' | null>(
    null,
  )
  const [stockInFormRef, setStockInFormRef] =
    useState<FormInstance<ToolingStockInFormValues> | null>(null)
  const [stockOutFormRef, setStockOutFormRef] = useState<FormInstance | null>(
    null,
  )

  const createStockInMutation = useCreateToolingStockIn()
  const createStockOutMutation = useCreateToolingStockOut()
  const { data: machineOptions = [], isLoading: isMachineOptionsLoading } =
    useMachineEquipmentOptions()

  const quickCreateDisabled = viewerDenied || !canManageTooling
  const quickCreateTip = viewerDenied
    ? viewerOperationTip
    : !canManageTooling
      ? '无刀具模块操作权限'
      : null

  const quickStockInInitialValues = useMemo<
    QuickStockInInitialValues | undefined
  >(() => {
    if (!record) return undefined

    return {
      id: record.id,
      tooling_data_id: record.id,
      tool_code: record.tool_code,
      tool_name: record.tool_name,
      tool_spec: record.tool_spec,
      material: record.material,
      unit_price: Number(record.unit_price ?? 0),
      status: '待审核',
      stock_in_quantity: 0,
      remarks: '',
    }
  }, [record])

  const quickStockOutInitialValues = useMemo<
    QuickStockOutInitialValues | undefined
  >(() => {
    if (!record) return undefined

    return {
      id: record.id,
      tooling_data_id: record.id,
      tool_code: record.tool_code,
      tool_name: record.tool_name,
      tool_spec: record.tool_spec,
      material: record.material,
      unit_price: Number(record.unit_price ?? 0),
      machine_equipment_id: null,
      recipient: '',
      purpose: '',
      stock_out_date: dayjs().format('YYYY-MM-DD'),
      status: '待审核',
      stock_out_quantity: 0,
      collection_method: '新领取',
      remarks: '',
    }
  }, [record])

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
    async (values: ToolingStockInFormValues) => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await createStockInMutation.mutateAsync(values)
        message.success('刀具入库创建成功，当前为待审核')
        closeQuickModal()
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '创建刀具入库失败，请稍后重试',
        )
      }
    },
    [
      canManageTooling,
      closeQuickModal,
      createStockInMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleQuickStockOutFinish = useCallback(
    async (values: ToolingStockOutFormValues) => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await createStockOutMutation.mutateAsync(values)
        message.success('刀具出库创建成功，当前为待审核')
        closeQuickModal()
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '创建刀具出库失败，请稍后重试',
        )
      }
    },
    [
      canManageTooling,
      closeQuickModal,
      createStockOutMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    if (!record) return []

    const items: NonNullable<TabsProps['items']> = []

    if (canViewStockIn) {
      items.push({
        key: 'stock-in',
        label: '入库记录',
        children: <ToolingStockInRecordsTab toolingDataId={record.id} />,
      })
    }

    if (canViewStockOut) {
      items.push({
        key: 'stock-out',
        label: '出库记录',
        children: <ToolingStockOutRecordsTab toolingDataId={record.id} />,
      })
    }

    return items
  }, [canViewStockIn, canViewStockOut, record])

  const canQuickCreate = canViewStockIn || canViewStockOut

  return (
    <Drawer
      title="刀具详情"
      size={880}
      open={open}
      destroyOnHidden
      onClose={handleClose}
    >
      {record ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="text-base font-medium text-slate-900 dark:text-slate-100">
              {record.tool_code} | {record.tool_name}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-3 dark:text-slate-300">
              <div>规格：{record.tool_spec || '-'}</div>
              <div>材质：{record.material || '-'}</div>
              <div>单价：{Number(record.unit_price ?? 0).toFixed(2)} 元</div>
              <div>用途：{record.usage || '-'}</div>
              <div className="col-span-2">备注：{record.remarks || '-'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              库存
            </div>
            {canViewInventory ? (
              <InventorySummary toolingDataId={record.id} />
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500">
                无刀具库存页面权限，暂不能查看库存
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
                新建单据默认为待审核，审核通过后自动更新库存；审核请前往刀具入库
                / 刀具出库页面操作。
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
              无刀具入库 / 出库页面权限，暂不能查看出入库记录
            </div>
          )}
        </div>
      ) : null}

      <Modal
        title="新建刀具入库"
        open={quickMode === 'stock-in'}
        destroyOnHidden
        confirmLoading={createStockInMutation.isPending}
        okButtonProps={{ disabled: quickCreateDisabled }}
        onOk={() => stockInFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        <ToolingStockInForm
          onFinish={handleQuickStockInFinish}
          setFormRef={setStockInFormRef}
          isSubmitting={createStockInMutation.isPending}
          toolingOptions={[]}
          isToolingOptionsLoading={false}
          onToolingSearch={() => {}}
          initialValues={quickStockInInitialValues}
          lockTooling
        />
      </Modal>

      <Modal
        title="新建刀具出库"
        open={quickMode === 'stock-out'}
        destroyOnHidden
        confirmLoading={createStockOutMutation.isPending}
        okButtonProps={{ disabled: quickCreateDisabled }}
        onOk={() => stockOutFormRef?.submit()}
        onCancel={closeQuickModal}
      >
        <ToolingStockOutForm
          onFinish={handleQuickStockOutFinish}
          setFormRef={setStockOutFormRef}
          isSubmitting={createStockOutMutation.isPending}
          toolingOptions={[]}
          isToolingOptionsLoading={false}
          onToolingSearch={() => {}}
          machineOptions={machineOptions}
          isMachineOptionsLoading={isMachineOptionsLoading}
          initialValues={quickStockOutInitialValues}
          lockTooling
        />
      </Modal>
    </Drawer>
  )
}
