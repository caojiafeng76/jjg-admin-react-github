import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from '@/services/apiProductionOrderItems'
import type { ProductionOrder, ProductionOrderFilters, ProductionOrderShift } from '@/services/apiProductionOrders'
import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { useQuery } from '@tanstack/react-query'
import { App, Button, Modal } from 'antd'
import dayjs from 'dayjs'

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isAdminRole, isEmployeeSideRole } from '@/config/access'
import { queryConfig } from '@/config/queryClient'
import { useAuth } from '@/contexts/useAuth'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  checkEmployeeOrderExistsOnDate,

} from '@/services/apiProductionOrders'
import AppPagination from '@/ui/AppPagination'
import { useAllEmployees } from '../workshop/EmployeeList/useEmployees'
import ProductionOrderAdminToolbar from './ProductionOrderAdminToolbar'
import ProductionOrderDetail from './ProductionOrderDetail'
import ProductionOrderForm from './ProductionOrderForm'
import ProductionOrderList from './ProductionOrderList'
import ProductionOrderManagementLock from './ProductionOrderManagementLock'
import ProductionOrderManagementPasswordModal from './ProductionOrderManagementPasswordModal'
import ProductionOrderMobileList from './ProductionOrderMobileList'
import { isAuditedRecord } from './productionOrderPageUtils'
import ProductionOrderSearch from './ProductionOrderSearch'
import { useProductionOrderExport } from './useProductionOrderExport'
import { useProductionOrderManagementAccess } from './useProductionOrderManagementAccess'
import {
  useBatchUpdateProductionOrders,
  useDeleteProductionOrders,
  useProductionOrder,
  useProductionOrders,
} from './useProductionOrders'
import { useProductionOrderSubmit } from './useProductionOrderSubmit'

export default function ProductionOrderPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const isAdminManagementView = isAdminRole(role) && !isEmployeeView
  const fixedEmployee = useMemo(
    () =>
      isEmployeeView && employeeProfile?.id
        ? { id: employeeProfile.id, name: employeeProfile.name }
        : null,
    [employeeProfile, isEmployeeView],
  )
  const fixedEmployeeId = fixedEmployee?.id

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建工单')
  const [isEdit, setIsEdit] = useState(false)
  const [isView, setIsView] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProductionOrder | null>(
    null,
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setIsView(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
  }, [])
  const {
    changePasswordForm,
    closePasswordModal,
    handleChangeManagementPassword,
    handleLockManagement,
    handleUnlockManagement,
    isManagementLocked,
    isManagementPasswordModalOpen,
    isUnlockingManagement,
    isUpdatingManagementPassword,
    openPasswordModal,
    unlockForm,
  } = useProductionOrderManagementAccess({
    isAdminManagementView,
    isEmployeeView,
    resetFormState,
  })

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<ProductionOrderFilters>(() => ({
    employeeId:
      (isEmployeeView ? employeeProfile?.id : undefined)
      || searchParamsURL.get('employeeId')
      || undefined,
    isAudited:
      searchParamsURL.get('isAudited') === null
        ? undefined
        : searchParamsURL.get('isAudited') === 'true',
    shift:
      searchParamsURL.get('shift') === '白班'
      || searchParamsURL.get('shift') === '夜班'
        ? (searchParamsURL.get('shift') as ProductionOrderShift)
        : undefined,
    dataCategory:
      searchParamsURL.get('dataCategory') === 'A'
      || searchParamsURL.get('dataCategory') === 'B'
        ? (searchParamsURL.get('dataCategory') as ProductionOrderDataCategory)
        : undefined,
  }))

  const {
    data: orderData,
    isFetching,
    isLoading,
    isPlaceholderData,
  } = useProductionOrders({
    page,
    pageSize,
    filters,
    options: {
      enabled: !isManagementLocked,
      realtime: isEmployeeView && !isModalOpen,
    },
  })

  const { data: detailData, isLoading: isLoadingDetail } = useProductionOrder(
    editingRecord?.id,
    {
      enabled: !isManagementLocked,
      realtime: isEmployeeView && isModalOpen && isView,
    },
  )

  const { data: allEmployees } = useAllEmployees()
  const employees = fixedEmployee ? [fixedEmployee] : allEmployees || []

  const todayStr = dayjs().format('YYYY-MM-DD')
  const { data: hasOrderToday = false } = useQuery({
    queryKey: ['production-orders-today-check', fixedEmployee?.id, todayStr],
    queryFn: () => checkEmployeeOrderExistsOnDate(fixedEmployee!.id, todayStr),
    enabled: isEmployeeView && Boolean(fixedEmployee?.id),
    // 今日工单检查必须每次进入都最新；创建工单成功后已有 invalidate 联动，
    // 因此复用 realtime 的 staleTime:0 语义，但不引入 30s 轮询
    ...queryConfig.realtime,
    refetchInterval: undefined,
  })

  const batchUpdateMutation = useBatchUpdateProductionOrders()
  const deleteMutation = useDeleteProductionOrders()
  const handleFinish = useProductionOrderSubmit({
    detailData,
    editingRecord,
    fixedEmployeeId,
    isEdit,
    isEmployeeView,
    resetFormState,
  })
  const {
    handleExport,
    handleNightSnackExport,
    isExporting,
    isNightSnackExporting,
    preloadProductionOrderExcel,
    preloadProductionOrderNightSnackExcel,
  } = useProductionOrderExport({
    employeeName: employeeProfile?.name,
    filters,
    selectedRowKeys,
    setSelectedRowKeys,
    total: orderData?.total,
  })
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })
  const handleCreate = useCallback(() => {
    if (isEmployeeView) {
      navigate('/production-order/create')
      return
    }

    setIsEdit(false)
    setIsView(false)
    setModalTitle('创建工单')
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [isEmployeeView, navigate])

  const handleEdit = useCallback(
    (record?: ProductionOrder) => {
      const targetRecord
        = record
          || orderData?.items.find(item => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (isEmployeeView && isAuditedRecord(targetRecord)) {
        message.warning('已审核工单员工无法编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsEdit(true)
      setIsView(false)
      setModalTitle('编辑工单')
      setIsModalOpen(true)
    },
    [isEmployeeView, message, orderData?.items, selectedRowKeys],
  )

  const handleView = useCallback(
    (record: ProductionOrder) => {
      if (isEmployeeView) {
        navigate(`/production-order/${record.id}`)
        return
      }

      setEditingRecord(record)
      setIsView(true)
      setIsEdit(false)
      setModalTitle('工单详情')
      setIsModalOpen(true)
    },
    [isEmployeeView, navigate],
  )

  const handleDelete = useCallback(
    (ids?: string[]) => {
      const deleteIds = ids || selectedRowKeys
      if (deleteIds.length === 0) {
        message.warning('请选择至少一条数据')
        return
      }
      deleteMutation.mutate(deleteIds as string[], {
        onSuccess: () => {
          message.success('删除成功')
          setSelectedRowKeys([])
        },
        onError: (error) => {
          if (error instanceof Error) {
            message.error(error.message)
          }
          else {
            message.error('删除失败，请稍后重试')
          }
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleSelect = useCallback((keys: React.Key[]) => {
    startTransition(() => {
      setSelectedRowKeys(keys)
    })
  }, [])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要${isAudited ? '审核' : '反审核'}的工单`)
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}工单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 张工单标记为${isAudited ? '已审核' : '待审核'}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await batchUpdateMutation.mutateAsync({
              ids: selectedRowKeys as string[],
              values: {
                is_audited: isAudited,
                audited_at: isAudited ? undefined : null,
              },
            })
            message.success(`批量${isAudited ? '审核' : '反审核'}成功`)
            setSelectedRowKeys([])
          }
          catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            }
            else {
              message.error(
                `批量${isAudited ? '审核' : '反审核'}失败，请稍后重试`,
              )
            }
          }
        },
      })
    },
    [batchUpdateMutation, message, modal, selectedRowKeys],
  )

  const handleSearch = useCallback(
    (params: ProductionOrderFilters) => {
      setFilters(
        fixedEmployeeId ? { ...params, employeeId: fixedEmployeeId } : params,
      )
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [fixedEmployeeId, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setFilters(fixedEmployeeId ? { employeeId: fixedEmployeeId } : {})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [fixedEmployeeId, searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (fixedEmployeeId) {
      setFilters(prev => ({ ...prev, employeeId: fixedEmployeeId }))
    }
  }, [fixedEmployeeId])

  useEffect(() => {
    if (
      page > 1
      && orderData
      && !isFetching
      && !isPlaceholderData
      && orderData.total > 0
      && orderData.items.length === 0
    ) {
      setSearchParamsURL((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', Math.max(page - 1, 1).toString())
        return next
      })
    }
  }, [isFetching, isPlaceholderData, orderData, page, setSearchParamsURL])

  const detailOrder = (detailData || editingRecord) as
    | (ProductionOrder & {
      items?: ProductionOrderItem[]
      employee?: { name: string }
    })
    | null

  if (isManagementLocked) {
    return (
      <>
        <ProductionOrderManagementLock
          isUnlocking={isUnlockingManagement}
          onOpenPasswordModal={openPasswordModal}
          onUnlock={handleUnlockManagement}
          unlockForm={unlockForm}
        />
        <ProductionOrderManagementPasswordModal
          confirmLoading={isUpdatingManagementPassword}
          form={changePasswordForm}
          onCancel={closePasswordModal}
          onSubmit={handleChangeManagementPassword}
          open={isManagementPasswordModalOpen}
        />
      </>
    )
  }
  return (
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr] gap-3 p-3'
          : 'flex h-full flex-col'
      }
    >
      {/* 页面标题与操作区 */}
      <div
        className={
          isEmployeeView
            ? 'w-full'
            : 'rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 shadow-sm dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:shadow-none'
        }
      >
        {isEmployeeView
          ? (
              <div className="space-y-1">
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<PlusCircleIcon className="size-4" />}
                  onClick={handleCreate}
                  disabled={hasOrderToday}
                  className="h-12 rounded-2xl shadow-lg shadow-blue-500/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 active:translate-y-0"
                >
                  手动添加
                </Button>
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                  {hasOrderToday
                    ? '当前用户当天已存在工单，不能重复手动创建'
                    : '手动添加会先创建工单，再进入详情维护工序'}
                </p>
              </div>
            )
          : (
              <ProductionOrderAdminToolbar
                handleBatchAudit={handleBatchAudit}
                handleCreate={handleCreate}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleExport={handleExport}
                handleLockManagement={handleLockManagement}
                handleNightSnackExport={handleNightSnackExport}
                isBatchUpdating={batchUpdateMutation.isPending}
                isDeleting={deleteMutation.isPending}
                isExporting={isExporting}
                isNightSnackExporting={isNightSnackExporting}
                onOpenPasswordModal={openPasswordModal}
                preloadProductionOrderExcel={preloadProductionOrderExcel}
                preloadProductionOrderNightSnackExcel={
                  preloadProductionOrderNightSnackExcel
                }
                selectedRowKeys={selectedRowKeys}
                total={orderData?.total}
              />
            )}
      </div>
      {/* 搜索区域 */}
      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none'
            : 'rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-none'
        }
      >
        {isEmployeeView
          ? null
          : (
              <span className="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                筛选条件
              </span>
            )}
        <ProductionOrderSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          employees={employees}
          initialValues={filters}
          fixedEmployee={fixedEmployee}
          mobile={isEmployeeView}
        />
      </div>
      {isEmployeeView
        ? (
            <div
              ref={tableContainerRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
            >
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <ProductionOrderMobileList
                  loading={isLoading}
                  data={orderData?.items || []}
                  selectedRowKeys={selectedRowKeys}
                  onSelect={handleSelect}
                  onView={handleView}
                />
              </div>
              <div
                ref={paginationRef}
                className="flex shrink-0 justify-center pb-1"
              >
                <AppPagination
                  total={orderData?.total || 0}
                  pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
                />
              </div>
            </div>
          )
        : (
            <div
              ref={tableContainerRef}
              className="flex h-full flex-col gap-3 overflow-hidden"
            >
              {/* 数据统计卡片 */}
              {orderData && orderData.total > 0 && (
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200/60 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-2.5 text-sm transition-all duration-300 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400">共</span>
                    <span className="font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                      {orderData.total}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      条记录
                    </span>
                  </div>
                  {selectedRowKeys.length > 0 && (
                    <>
                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">
                          已选中
                        </span>
                        <span className="font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                          {selectedRowKeys.length}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          项
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-none">
                <ProductionOrderList
                  loading={isLoading}
                  data={orderData?.items || []}
                  page={page}
                  pageSize={pageSize}
                  selectedRowKeys={selectedRowKeys}
                  onSelect={handleSelect}
                  onView={handleView}
                  scrollY={scrollY}
                />
              </div>
              <div
                ref={paginationRef}
                className="flex shrink-0 items-center justify-between rounded-lg border border-slate-200/60 bg-white px-4 py-2 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-none"
              >
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  每页显示条数
                </span>
                <AppPagination
                  total={orderData?.total || 0}
                  pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
                />
              </div>
            </div>
          )}
      {!isEmployeeView
        ? (
            <>
              <ProductionOrderForm
                open={isModalOpen && !isView}
                onCancel={resetFormState}
                onSubmit={handleFinish}
                initialValues={detailData || editingRecord || undefined}
                employees={employees}
                fixedEmployee={fixedEmployee}
                loading={isLoadingDetail && !!editingRecord?.id}
                compact={false}
                showAuditField={!isEmployeeView}
              />

              <Modal
                title={modalTitle}
                open={isModalOpen && isView}
                onCancel={resetFormState}
                footer={[]}
                width={900}
                destroyOnHidden
              >
                {detailOrder
                  ? (
                      <ProductionOrderDetail
                        order={detailOrder}
                        compact={false}
                        canEdit={!(isEmployeeView && isAuditedRecord(detailOrder))}
                        onEdit={() => {
                          if (isEmployeeView && isAuditedRecord(detailOrder)) {
                            message.warning('已审核工单员工无法编辑')
                            return
                          }

                          setIsView(false)
                          setIsEdit(true)
                          setModalTitle('编辑工单')
                        }}
                      />
                    )
                  : null}
              </Modal>
            </>
          )
        : null}
      <ProductionOrderManagementPasswordModal
        confirmLoading={isUpdatingManagementPassword}
        form={changePasswordForm}
        onCancel={closePasswordModal}
        onSubmit={handleChangeManagementPassword}
        open={isManagementPasswordModalOpen}
      />{' '}
    </div>
  )
}
