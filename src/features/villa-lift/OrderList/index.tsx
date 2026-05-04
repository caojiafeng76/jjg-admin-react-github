import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { useCallback, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  App,
  Button,
  DatePicker,
  FormInstance,
  Input,
  Modal,
  Popconfirm,
  Tabs,
} from 'antd'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CubeIcon,
  FilmIcon,
  PaintBrushIcon,
  ScissorsIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/16/solid'

import { usePermissions } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  VillaLiftMarkDateField,
  VillaLiftOrder,
  VillaLiftOrderFormValues,
  VillaLiftOrderItemFormValues,
  VillaLiftOrderStatus,
} from '@/services/apiVillaLiftOrders'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import {
  useBatchDeleteVillaLiftOrders,
  useBatchMarkVillaLiftOrdersDate,
  useBatchUpdateVillaLiftOrdersStatus,
  useCreateVillaLiftOrder,
  useUpdateVillaLiftOrder,
  useUpsertVillaLiftOrderItems,
  useVillaLiftOrderItems,
  useVillaLiftOrders,
} from './useVillaLiftOrders'
import VillaLiftOrderForm from './VillaLiftOrderForm'
import VillaLiftOrderTable from './VillaLiftOrderTable'
import { useExportVillaLiftOrdersAsExcel } from './useExportVillaLiftOrdersAsExcel'

// ----------------------------------------------------------------
// 明细编辑子弹窗
// ----------------------------------------------------------------
interface ItemsModalProps {
  open: boolean
  orderId: string | null
  onClose: () => void
}

function ItemsModal({ open, orderId, onClose }: ItemsModalProps) {
  const { message } = App.useApp()
  const { data: items = [], isLoading } = useVillaLiftOrderItems(
    open ? orderId : null,
  )
  const upsertMutation = useUpsertVillaLiftOrderItems()
  const formRef = useRef<FormInstance<{
    items: VillaLiftOrderItemFormValues[]
  }> | null>(null)

  async function handleOk() {
    if (!orderId || !formRef.current) return
    try {
      const values = await formRef.current.validateFields()
      await upsertMutation.mutateAsync({
        orderId,
        items: values.items ?? [],
      })
      message.success('明细保存成功')
      onClose()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    }
  }

  return (
    <Modal
      title="编辑订单明细"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={upsertMutation.isPending}
      width={800}
      destroyOnClose
    >
      <VillaLiftOrderForm
        onFinish={() => {}}
        setFormRef={(f) => {
          formRef.current = f as unknown as FormInstance<{
            items: VillaLiftOrderItemFormValues[]
          }>
        }}
        isSubmitting={upsertMutation.isPending}
        initialValues={
          orderId
            ? ({
                id: orderId,
                schedule_date: null,
                delivery_date: null,
                customer: '',
                project_name: '',
                product_name: '',
                color: '',
                quantity: 0,
                remarks: '',
                created_at: '',
                updated_at: '',
                items: isLoading ? [] : items,
              } as VillaLiftOrder)
            : null
        }
        itemsOnly
      />
    </Modal>
  )
}

// ----------------------------------------------------------------
// 主页面
// ----------------------------------------------------------------
export default function VillaLiftOrderListPage() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const perms = usePermissions([
    'feature:villa-lift-order.create',
    'feature:villa-lift-order.edit',
    'feature:villa-lift-order.edit-items',
    'feature:villa-lift-order.delete',
    'feature:villa-lift-order.close',
    'feature:villa-lift-order.reopen',
    'feature:villa-lift-order.mark-material',
    'feature:villa-lift-order.mark-painting',
    'feature:villa-lift-order.mark-film',
    'feature:villa-lift-order.mark-cutting',
    'feature:villa-lift-order.mark-processing',
    'feature:villa-lift-order.mark-cabin-processing',
    'feature:villa-lift-order.mark-middle-door-processing',
    'feature:villa-lift-order.mark-frame-processing',
  ])
  const canCreate = perms['feature:villa-lift-order.create']
  const canEdit = perms['feature:villa-lift-order.edit']
  const canEditItems = perms['feature:villa-lift-order.edit-items']
  const canDelete = perms['feature:villa-lift-order.delete']
  const canClose = perms['feature:villa-lift-order.close']
  const canReopen = perms['feature:villa-lift-order.reopen']
  const canMarkMaterial = perms['feature:villa-lift-order.mark-material']
  const canMarkPainting = perms['feature:villa-lift-order.mark-painting']
  const canMarkFilm = perms['feature:villa-lift-order.mark-film']
  const canMarkCutting = perms['feature:villa-lift-order.mark-cutting']
  const canMarkProcessing = perms['feature:villa-lift-order.mark-processing']
  const canMarkCabinProcessing =
    perms['feature:villa-lift-order.mark-cabin-processing']
  const canMarkMiddleDoorProcessing =
    perms['feature:villa-lift-order.mark-middle-door-processing']
  const canMarkFrameProcessing =
    perms['feature:villa-lift-order.mark-frame-processing']

  // URL 参数
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const activeStatus = (searchParamsURL.get('status') ??
    'open') as VillaLiftOrderStatus

  // 搜索输入框本地状态（未提交）
  const [localCustomer, setLocalCustomer] = useState('')
  const [localProjectName, setLocalProjectName] = useState('')
  const [localProductName, setLocalProductName] = useState('')
  const [deliveryDateRange, setDeliveryDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [scheduleDateRange, setScheduleDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [processingRequiredDateRange, setProcessingRequiredDateRange] =
    useState<[Dayjs | null, Dayjs | null] | null>(null)

  // 已提交（触发查询）的筛选值
  const [submittedCustomer, setSubmittedCustomer] = useState<
    string | undefined
  >()
  const [submittedProjectName, setSubmittedProjectName] = useState<
    string | undefined
  >()
  const [submittedProductName, setSubmittedProductName] = useState<
    string | undefined
  >()

  // 订单弹窗
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VillaLiftOrder | null>(
    null,
  )
  const [formRef, setFormRef] =
    useState<FormInstance<VillaLiftOrderFormValues> | null>(null)

  // 明细弹窗
  const [itemsModalOpen, setItemsModalOpen] = useState(false)
  const [itemsOrderId, setItemsOrderId] = useState<string | null>(null)

  // 批量操作选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  // 发货日期范围（YYYY-MM-DD 字符串，传给服务层）
  const deliveryDateFrom =
    deliveryDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const deliveryDateTo =
    deliveryDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined
  // 排产日期范围
  const scheduleDateFrom =
    scheduleDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const scheduleDateTo =
    scheduleDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined
  // 计划加工日期（加工要求完成日期）范围
  const processingRequiredDateFrom =
    processingRequiredDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const processingRequiredDateTo =
    processingRequiredDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined

  // 数据
  const { data, isLoading } = useVillaLiftOrders({
    page,
    pageSize,
    status: activeStatus,
    customer: submittedCustomer,
    projectName: submittedProjectName,
    productName: submittedProductName,
    deliveryDateFrom,
    deliveryDateTo,
    scheduleDateFrom,
    scheduleDateTo,
    processingRequiredDateFrom,
    processingRequiredDateTo,
  })
  const createMutation = useCreateVillaLiftOrder()
  const updateMutation = useUpdateVillaLiftOrder()
  const batchDeleteMutation = useBatchDeleteVillaLiftOrders()
  const batchStatusMutation = useBatchUpdateVillaLiftOrdersStatus()
  const batchMarkMutation = useBatchMarkVillaLiftOrdersDate()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      headerHeight: 32,
      targetRowCount: Math.min(pageSize, 14),
      minRowHeight: 30,
    })

  // 重置弹窗状态
  const resetModalState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    formRef?.resetFields()
  }, [formRef])

  // 新建订单
  const handleCreate = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsEdit(false)
    setEditingRecord(null)
    setModalTitle('新建别墅梯订单')
    setIsModalOpen(true)
  }, [message, viewerDenied, viewerOperationTip])

  // 行内编辑订单
  const handleEdit = useCallback(
    (record: VillaLiftOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setEditingRecord(record)
      setIsEdit(true)
      setModalTitle('编辑别墅梯订单')
      setIsModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchDeleteMutation.mutateAsync(selectedRowKeys)
      message.success(`已删除 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchDeleteMutation,
    selectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 批量结案
  const handleBatchClose = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'closed',
      })
      message.success(`已结案 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchStatusMutation,
    selectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 批量反结案
  const handleBatchReopen = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'open',
      })
      message.success(`已复开 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchStatusMutation,
    selectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 弹出明细编辑弹窗
  const handleEditItems = useCallback(
    (orderId: string) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setItemsOrderId(orderId)
      setItemsModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  // 标记完成日期（批量）
  const handleBatchMarkDate = useCallback(
    async (field: VillaLiftMarkDateField, label: string) => {
      const canBypassViewerGuard = field === 'film_date' && canMarkFilm

      if (viewerDenied && !canBypassViewerGuard) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) return
      try {
        await batchMarkMutation.mutateAsync({
          ids: selectedRowKeys,
          field,
          date: dayjs().format('YYYY-MM-DD'),
        })
        message.success(`已将 ${selectedRowKeys.length} 条订单标记为${label}`)
        setSelectedRowKeys([])
      } catch (err) {
        if (err instanceof Error) message.error(err.message)
      }
    },
    [
      batchMarkMutation,
      canMarkFilm,
      selectedRowKeys,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  // 提交订单表单
  const handleFinish = useCallback(
    async (values: VillaLiftOrderFormValues) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (isEdit && editingRecord) {
          const { items: _items, ...orderFields } = values
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: orderFields,
          })
          message.success('订单更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('订单创建成功')
        }
        resetModalState()
      } catch (err) {
        if (err instanceof Error) {
          message.error(err.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      editingRecord,
      isEdit,
      message,
      resetModalState,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  // 切换 Tab（未结案 / 已结案）
  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParamsURL)
    next.set('status', key)
    next.set('page', '1')
    setSearchParamsURL(next)
    setLocalCustomer('')
    setLocalProjectName('')
    setLocalProductName('')
    setDeliveryDateRange(null)
    setScheduleDateRange(null)
    setProcessingRequiredDateRange(null)
    setSubmittedCustomer(undefined)
    setSubmittedProjectName(undefined)
    setSubmittedProductName(undefined)
    setSelectedRowKeys([])
  }

  // 搜索
  const { exportAsExcel } = useExportVillaLiftOrdersAsExcel()

  function handleSearch() {
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    setSearchParamsURL(next)
    setSubmittedCustomer(localCustomer.trim() || undefined)
    setSubmittedProjectName(localProjectName.trim() || undefined)
    setSubmittedProductName(localProductName.trim() || undefined)
  }

  function handleSearchReset() {
    setLocalCustomer('')
    setLocalProjectName('')
    setLocalProductName('')
    setDeliveryDateRange(null)
    setScheduleDateRange(null)
    setProcessingRequiredDateRange(null)
    setSubmittedCustomer(undefined)
    setSubmittedProjectName(undefined)
    setSubmittedProductName(undefined)
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    setSearchParamsURL(next)
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2">
      {/* 状态 Tab */}
      <div className="flex flex-col gap-2">
        <Tabs
          activeKey={activeStatus}
          onChange={handleTabChange}
          items={[
            { key: 'open', label: '未结案' },
            { key: 'closed', label: '已结案' },
          ]}
          className="mb-0!"
        />
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && <AddButton handleCreate={handleCreate} />}
          {selectedRowKeys.length > 0 && (
            <>
              {canDelete && (
                <Popconfirm
                  title={`确认删除选中的 ${selectedRowKeys.length} 条订单？`}
                  description="删除后不可恢复，同时删除所有明细。"
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true, disabled: viewerDenied }}
                  onConfirm={handleBatchDelete}
                >
                  <Button
                    type="text"
                    danger
                    icon={<TrashIcon className="size-4" />}
                    loading={batchDeleteMutation.isPending}
                    disabled={viewerDenied}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              {canClose && activeStatus === 'open' && (
                <Button
                  type="text"
                  icon={
                    <CheckCircleIcon className="size-4 text-green-500/80!" />
                  }
                  loading={batchStatusMutation.isPending}
                  onClick={handleBatchClose}
                  disabled={viewerDenied}
                >
                  批量结案 ({selectedRowKeys.length})
                </Button>
              )}
              {canReopen && activeStatus === 'closed' && (
                <Button
                  type="text"
                  icon={
                    <ArrowUturnLeftIcon className="size-4 text-blue-400/80!" />
                  }
                  loading={batchStatusMutation.isPending}
                  onClick={handleBatchReopen}
                  disabled={viewerDenied}
                >
                  批量反结案 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkMaterial && (
                <Button
                  type="text"
                  icon={<CubeIcon className="size-4 text-purple-500/80!" />}
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('material_selection_date', '挑料完成')
                  }
                >
                  挑料完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkPainting && (
                <Button
                  type="text"
                  icon={<PaintBrushIcon className="size-4 text-blue-500/80!" />}
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('painting_date', '喷涂完成')
                  }
                >
                  喷涂完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkFilm && (
                <Button
                  type="text"
                  icon={<FilmIcon className="size-4 text-cyan-500/80!" />}
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied && !canMarkFilm}
                  onClick={() => handleBatchMarkDate('film_date', '贴膜完成')}
                >
                  贴膜完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkCutting && (
                <Button
                  type="text"
                  icon={<ScissorsIcon className="size-4 text-orange-500/80!" />}
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('cutting_actual_date', '切割完成')
                  }
                >
                  切割完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkProcessing && (
                <Button
                  type="text"
                  icon={
                    <WrenchScrewdriverIcon className="size-4 text-amber-600/80!" />
                  }
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('processing_actual_date', '加工完成')
                  }
                >
                  加工完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkCabinProcessing && (
                <Button
                  type="text"
                  icon={
                    <WrenchScrewdriverIcon className="size-4 text-rose-500/80!" />
                  }
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('cabin_processing_date', '轿箱加工完成')
                  }
                >
                  轿箱加工完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkMiddleDoorProcessing && (
                <Button
                  type="text"
                  icon={
                    <WrenchScrewdriverIcon className="size-4 text-emerald-500/80!" />
                  }
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate(
                      'middle_door_processing_date',
                      '中分门加工完成',
                    )
                  }
                >
                  中分门加工完成 ({selectedRowKeys.length})
                </Button>
              )}
              {canMarkFrameProcessing && (
                <Button
                  type="text"
                  icon={
                    <WrenchScrewdriverIcon className="size-4 text-indigo-500/80!" />
                  }
                  loading={batchMarkMutation.isPending}
                  disabled={viewerDenied}
                  onClick={() =>
                    handleBatchMarkDate('frame_processing_date', '井架加工完成')
                  }
                >
                  井架加工完成 ({selectedRowKeys.length})
                </Button>
              )}
            </>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="客户"
              value={localCustomer}
              onChange={(e) => setLocalCustomer(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 150 }}
            />
            <Input
              placeholder="项目名称"
              value={localProjectName}
              onChange={(e) => setLocalProjectName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 160 }}
            />
            <Input
              placeholder="产品名称"
              value={localProductName}
              onChange={(e) => setLocalProductName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 150 }}
            />
            <DatePicker.RangePicker
              placeholder={['发货日期从', '发货日期至']}
              value={deliveryDateRange}
              onChange={(dates) =>
                setDeliveryDateRange(
                  dates ? [dates[0] ?? null, dates[1] ?? null] : null,
                )
              }
              style={{ width: 240 }}
              allowClear
            />
            <DatePicker.RangePicker
              placeholder={['排产日期从', '排产日期至']}
              value={scheduleDateRange}
              onChange={(dates) =>
                setScheduleDateRange(
                  dates ? [dates[0] ?? null, dates[1] ?? null] : null,
                )
              }
              style={{ width: 240 }}
              allowClear
            />
            <DatePicker.RangePicker
              placeholder={['计划加工日期从', '计划加工日期至']}
              value={processingRequiredDateRange}
              onChange={(dates) =>
                setProcessingRequiredDateRange(
                  dates ? [dates[0] ?? null, dates[1] ?? null] : null,
                )
              }
              style={{ width: 260 }}
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleSearchReset}>重置</Button>
            <Button
              type="text"
              icon={
                <DocumentArrowDownIcon className="size-4 text-green-500/80!" />
              }
              onClick={() => {
                const success = exportAsExcel(data?.orders ?? [])
                if (success) {
                  message.success(`已导出 ${data?.orders?.length ?? 0} 条订单`)
                } else {
                  message.warning('当前列表无数据可导出')
                }
              }}
            >
              导出Excel
            </Button>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <VillaLiftOrderTable
            loading={isLoading}
            data={data?.orders ?? []}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
            canEdit={!viewerDenied && canEdit}
            canEditItems={!viewerDenied && canEditItems}
            onEdit={handleEdit}
            onEditItems={handleEditItems}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.count ?? 0} />
        </div>
      </div>

      {/* 订单新建/编辑弹窗 */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={() => formRef?.submit()}
        onCancel={resetModalState}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied }}
        width={760}
        destroyOnClose
      >
        <VillaLiftOrderForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={editingRecord}
          orderOnly={isEdit}
        />
      </Modal>

      {/* 明细编辑弹窗 */}
      <ItemsModal
        open={itemsModalOpen}
        orderId={itemsOrderId}
        onClose={() => {
          setItemsModalOpen(false)
          setItemsOrderId(null)
        }}
      />
    </div>
  )
}
